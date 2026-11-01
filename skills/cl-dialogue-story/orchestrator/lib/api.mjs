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

export function prepareVoiceRequest({ text, voiceId, model, emotion, reaction, format, speed }, options) {
  const selected = Array.isArray(options?.models)
    ? options.models.find(entry => entry.id === (model ?? options.default_model)) : undefined;
  if (!selected || typeof selected.id !== "string" ||
      !Array.isArray(selected.emotions) || !Array.isArray(selected.tags) ||
      !Array.isArray(selected.formats) || !Number.isFinite(selected.speed?.min) ||
      !Number.isFinite(selected.speed?.max) || !Number.isInteger(selected.max_text_chars) ||
      selected.max_text_chars <= 0 || typeof options.options_version !== "string") {
    throw new Error("Speech options unavailable or model unsupported. Update the voice services; do not fall back to plain speech.");
  }
  if (emotion != null && !selected.emotions.includes(emotion)) throw new Error(`Unsupported speech emotion: ${emotion}`);
  if (reaction != null && !selected.tags.includes(reaction)) throw new Error(`Unsupported reaction tag: ${reaction}`);
  if (typeof text !== "string" || !text.trim() || typeof voiceId !== "string" || !voiceId.trim()) throw new Error("Speech text and an authorized voice ID are required.");
  const request = {
    text: reaction == null ? text : `(${reaction}) ${text}`,
    voice_id: voiceId, model: selected.id, emotion: emotion ?? null,
    format: format ?? options.default_format, speed: speed ?? options.default_speed,
  };
  if (!selected.formats.includes(request.format)) throw new Error(`Unsupported speech format: ${request.format}`);
  if (typeof request.speed !== "number" || !Number.isFinite(request.speed) ||
      request.speed < selected.speed.min || request.speed > selected.speed.max) throw new Error("Speech speed is outside the advertised range.");
  if (request.text.length > selected.max_text_chars) throw new Error("Speech text exceeds the advertised limit.");
  return request;
}

export function createVoiceClient(transport) {
  return {
    options: () => transport.get("/api/bridge/voice/options"),
    generate: async (params, options) => {
      const request = prepareVoiceRequest(params, options);
      const out = await transport.post("/api/bridge/voice/generate", request);
      if (!out.audio_url || !out.history_id || out.persistence_error ||
          ["model", "emotion", "speed", "format"].some(key => out[key] !== request[key])) {
        throw Object.assign(new Error("Speech output/history/settings need reconciliation. Retain the returned audio; do not regenerate."), { data: out });
      }
      return { url: out.audio_url, duration: out.duration_seconds, raw: out, request };
    },
  };
}

const voiceClient = createVoiceClient(client);
export const voiceOptions = voiceClient.options;
export const voiceGenerate = voiceClient.generate;
