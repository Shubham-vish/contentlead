// Dependency-free Desktop helpers. Discovery is read only when executing a request.
import { createEditorClient } from "./client.mjs";
export { loadApi } from "./client.mjs";

const client = createEditorClient();
export const configureTarget = target => client.setTarget(target);
export const assertTargetReady = () => client.assertTarget();
export const execute = async (type, params) => {
  const out = await client.execute(type, params);
  if (out.editorHealth?.hasNewErrors || out.warnings?.length) {
    console.warn(`Editor health needs review after ${type}; inspect the targeted renderer.`);
  }
  return out;
};
export const health = () => client.health();

export async function aiBridge(action, body) {
  return client.post(`/api/bridge/ai/${action}`, body);
}

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

export async function downloadTo(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Asset download failed (HTTP ${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync, mkdirSync } = await import("node:fs");
  const path = await import("node:path");
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, buf);
  return filePath;
}

export async function voiceGenerate({ text, voiceId, format = "mp3", speed = 1.0 }) {
  const out = await client.post("/api/bridge/voice/generate", { text, voice_id: voiceId, format, speed });
  return { url: out.audio_url ?? out.url, duration: out.duration_seconds ?? out.duration, raw: out };
}
