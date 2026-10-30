import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createEditorClient } from "./client.mjs";
import { createLayerInserter } from "./timeline.mjs";

const response = result => new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
const ready = () => ({ status: "success", result: {
  hydration: { status: "ready", contentId: "content-a" }, readyForWrites: true,
  commands: ["editor.addImage", "query.getTrackInfo", "editor.editTrack"],
} });
const discovery = () => ({ port: 43210, token: "isolated-test-token" });

test("offline plan needs no discovery/token/private overlay and never writes the script", () => {
  const script = fileURLToPath(new URL("../scripts/example.dialogue.json", import.meta.url));
  const before = readFileSync(script, "utf8");
  const child = spawnSync(process.execPath, [
    fileURLToPath(new URL("../run.mjs", import.meta.url)), script, "--plan",
  ], {
    encoding: "utf8", timeout: 10000,
    env: { PATH: process.env.PATH, HOME: path.join(process.cwd(), ".nonexistent-dialogue-test-home") },
  });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /No API calls, private overlay reads or script writes/);
  assert.equal(readFileSync(script, "utf8"), before);
});

test("missing target and invalid discovery reject before any request", async () => {
  let reads = 0, requests = 0;
  const client = createEditorClient({
    readDiscovery: () => { reads++; return { port: 99999, token: "" }; },
    fetchImpl: async () => { requests++; throw new Error("No network allowed"); },
  });
  await assert.rejects(client.execute("editor.addImage", {}), /Explicit/);
  assert.equal(reads, 0);
  assert.throws(() => client.setTarget({ tabId: "tab-a" }), /content-id/);
  client.setTarget({ tabId: "tab-a", contentId: "content-a" });
  await assert.rejects(client.execute("editor.addImage", {}), /Invalid Desktop discovery/);
  assert.equal(requests, 0);
});

test("wrong, loading and read-only targets stop before editor/provider dispatch", async () => {
  for (const change of [
    cap => { cap.result.hydration.contentId = "other-project"; },
    cap => { cap.result.hydration.status = "loading"; },
    cap => { cap.result.readyForWrites = false; },
  ]) {
    const sent = [];
    const client = createEditorClient({ readDiscovery: discovery, fetchImpl: async (_url, init) => {
      sent.push(JSON.parse(init.body));
      const cap = ready(); change(cap); return response(cap);
    } });
    client.setTarget({ tabId: "explicit-tab", contentId: "content-a" });
    await assert.rejects(client.execute("editor.addImage", {}), /unverified/);
    await assert.rejects(client.post("/api/bridge/voice/generate", {}), /unverified/);
    assert.ok(sent.every(body => body.type === "query.getCapabilities" && body.tabId === "explicit-tab"));
  }
  const sent = [];
  const missingTab = createEditorClient({ readDiscovery: discovery, fetchImpl: async (_url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ status: "failed" }), { status: 404 });
  } });
  missingTab.setTarget({ tabId: "nonexistent-tab", contentId: "content-a" });
  await assert.rejects(missingTab.execute("editor.addImage", {}), /failed/);
  assert.deepEqual(sent.map(body => body.type), ["query.getCapabilities"]);
});

test("actual execute pins tab/content and treats HTTP200 failure as failure", async () => {
  const sent = [];
  const client = createEditorClient({ readDiscovery: discovery, fetchImpl: async (_url, init) => {
    const body = JSON.parse(init.body); sent.push(body);
    return response(body.type === "query.getCapabilities" ? ready() : { status: "failed" });
  } });
  client.setTarget({ tabId: "tab-a", contentId: "content-a" });
  await assert.rejects(client.execute("editor.addImage", { src: "https://media.test/image.png", createNewTrack: true }), /failed/);
  assert.deepEqual(sent[1], { tabId: "tab-a", type: "editor.addImage", params: {
    src: "https://media.test/image.png", createNewTrack: true, expectedContentId: "content-a",
  } });
  await assert.rejects(client.execute("not.supported", {}), /Unsupported renderer/);
  assert.equal(sent.filter(body => body.type !== "query.getCapabilities").length, 1);
});

test("actual layer inserts create owned tracks, reuse only those IDs and preserve visual order", async () => {
  const sent = [], tracks = [{ id: "unrelated", items: [] }], priorities = new Map();
  let sequence = 0;
  const insert = createLayerInserter(async (type, params) => {
    sent.push({ type, params });
    if (type === "query.getTrackInfo") return { status: "success", result: { tracks } };
    if (type === "editor.editTrack") { priorities.set(params.trackId, params.metadata.priority); return { status: "success" }; }
    const id = `item-${++sequence}`;
    if (params.createNewTrack) {
      assert.equal(params.trackId, undefined);
      tracks.push({ id: params.trackName, items: [{ id }] });
    } else {
      assert.notEqual(params.trackId, "unrelated");
      tracks.find(track => track.id === params.trackId).items.push({ id });
    }
    return { status: "success", result: { itemId: id } };
  });
  for (const role of ["audio", "background", "characters", "images", "captions", "title"]) {
    await insert(role, { src: "https://media.test/asset", from: 0, duration: 1000 });
  }
  await insert("characters", { src: "https://media.test/second.png", from: 1000, duration: 1000 });
  const adds = sent.filter(entry => !["query.getTrackInfo", "editor.editTrack"].includes(entry.type));
  assert.ok(adds.slice(0, 6).every(entry => entry.params.createNewTrack === true && entry.params.trackName.startsWith("Dialogue ")));
  assert.equal(adds.at(-1).params.trackId, "Dialogue characters");
  assert.equal(adds.at(-1).params.createNewTrack, undefined);
  assert.deepEqual([...priorities].sort((a, b) => a[1] - b[1]).map(([id]) => id), [
    "Dialogue title", "Dialogue captions", "Dialogue images", "Dialogue characters", "Dialogue background", "Dialogue audio",
  ]);
  assert.deepEqual(tracks[0], { id: "unrelated", items: [] });
});
