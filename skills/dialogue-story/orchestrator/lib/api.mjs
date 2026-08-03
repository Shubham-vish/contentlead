// lib/api.mjs — thin, dependency-free helpers for the dialogue-story orchestrator.
// Wires to the three live surfaces the skill depends on:
//   - ai-media  : POST /api/bridge/ai/*  (real JSON; per-user keys injected server-side)
//   - voice     : POST /api/bridge/voice/*
//   - contentlead editor : POST /api/execute { type:"editor.*", params }
// All are documented in their own skills; this only calls them in order.
// NOTE: the MCP proxy (/api/mcp/call) has been REMOVED for AI media/text/transcribe —
// everything now flows through the desktop AI bridge, same auth chain as voice.

import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";

export function loadApi() {
  const cfgPath = path.join(os.homedir(), ".skilltown-desktop", "api.json");
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  return { API: `http://127.0.0.1:${cfg.port}`, TOKEN: cfg.token };
}

const { API, TOKEN } = loadApi();
const AUTH = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function post(pathname, body) {
  const res = await fetch(`${API}${pathname}`, {
    method: "POST",
    headers: AUTH,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`POST ${pathname} → ${res.status}`);
    err.detail = json; err.sentBody = body;
    throw err;
  }
  return json;
}

export async function health() {
  const res = await fetch(`${API}/api/health`, { headers: AUTH });
  return res.json();
}

// ---- ai-media (desktop AI bridge) -----------------------------------------
// Real JSON in/out. Per-user Tavily/Gemini keys are injected by the SkillTown
// /api/ai proxy server-side — never send keys here.
export async function aiBridge(action, body) {
  return post(`/api/bridge/ai/${action}`, body);
}

// text/generate takes a REAL messages array (no stringification). Ask for strict JSON.
export async function textJson(system, user) {
  const messages = [
    { role: "system", content: system + "\nReturn ONLY valid minified JSON. No prose, no code fences." },
    { role: "user", content: user },
  ];
  const out = await aiBridge("text/generate", { messages });
  const content = out?.message ?? out?.content ?? out?.text ?? (typeof out === "string" ? out : JSON.stringify(out));
  return parseLooseJson(content);
}

export function parseLooseJson(s) {
  if (typeof s === "object") return s;
  const cleaned = String(s).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{"); const startArr = cleaned.indexOf("[");
  const i = startArr !== -1 && (startArr < start || start === -1) ? startArr : start;
  const j = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  return JSON.parse(i >= 0 && j >= 0 ? cleaned.slice(i, j + 1) : cleaned);
}

export async function imageSearch(query) {
  return aiBridge("image/search", { query: `${query} without watermark` });
}

export async function transcribeShort(audioUrl) {
  return aiBridge("transcribe/short", { video_url: audioUrl });
}

// Download a (possibly SAS/expiring) URL to a local file so the timeline can play it.
export async function downloadTo(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync, mkdirSync } = await import("node:fs");
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, buf);
  return filePath;
}

// ---- voice bridge (DIRECT — bypasses the MCP proxy) ------------------------
export async function voiceGenerate({ text, voiceId, format = "mp3", speed = 1.0 }) {
  // POST /api/bridge/voice/generate → { status, audio_url, format, duration_seconds }
  const out = await post("/api/bridge/voice/generate", { text, voice_id: voiceId, format, speed });
  return { url: out.audio_url ?? out.url, duration: out.duration_seconds ?? out.duration, raw: out };
}

// ---- contentlead editor ----------------------------------------------------
export async function execute(type, params) {
  const out = await post("/api/execute", { type, params });
  const warns = out?.warnings ?? [];
  const health = out?.editorHealth;
  if (health?.hasNewErrors || warns.length) {
    console.warn(`  ⚠ ${type} warnings:`, warns.slice(0, 3));
  }
  return out;
}

export { API };
