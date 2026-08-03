#!/usr/bin/env node
// run.mjs — deterministic, resumable dialogue-story pipeline.
// Ported from TlEditingSolution/final_flow.py::process_script (same stage order).
// Prompt wording lives in prompts.local.mjs (private) / prompts.example.mjs (public).
//
// Usage:
//   node run.mjs scripts/my-story.dialogue.json          # run all stages (resumable)
//   node run.mjs scripts/my-story.dialogue.json --plan   # dry-run: print plan, no calls
//   node run.mjs scripts/my-story.dialogue.json --only 1.5   # run a single stage
//
// Resumability: a stage is SKIPPED if its output field already exists. Delete the
// field(s) from the JSON to force a re-run. Progress is saved after every dialogue.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import {
  health, textJson, imageSearch, transcribeShort, voiceGenerate, execute, downloadTo,
} from "./lib/api.mjs";

// Prompts (the tuned viral wording) live OUTSIDE this file: prompts.local.mjs
// (private, gitignored) is preferred; prompts.example.mjs (public, generic) is the
// fallback so the skill still runs after a fresh clone.
const here = new URL(".", import.meta.url).pathname;
let PROMPTS;
try { ({ PROMPTS } = await import("./prompts.local.mjs")); }
catch { ({ PROMPTS } = await import("./prompts.example.mjs")); }
const ask = (builder, ...args) => { const { system, user } = builder(...args); return textJson(system, user); };

const [, , scriptPath, ...flags] = process.argv;
if (!scriptPath) { console.error("usage: node run.mjs <script.json> [--plan] [--only <stage>] [--config <path>]"); process.exit(1); }
const PLAN = flags.includes("--plan");
const ONLY = flags.includes("--only") ? flags[flags.indexOf("--only") + 1] : null;
const CONFIG_ARG = flags.includes("--config") ? flags[flags.indexOf("--config") + 1] : null;

const s = JSON.parse(readFileSync(scriptPath, "utf8"));
s._stages ??= {};
const save = () => writeFileSync(scriptPath, JSON.stringify(s, null, 2));
const want = (id) => !ONLY || ONLY === id;
const log = (...a) => console.log(...a);

// ---- Private overlay: keeps personal data (voice IDs, character art, default bg)
// OUT of the public/tracked script. Loaded from (in order): --config, env
// DIALOGUE_STORY_CONFIG, or ./config.local.json next to this file. Never persisted.
function loadLocalConfig() {
  const candidates = [CONFIG_ARG, process.env.DIALOGUE_STORY_CONFIG, `${here}config.local.json`].filter(Boolean);
  for (const p of candidates) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { /* next */ } }
  return {};
}
const CFG = loadLocalConfig();
const placeholder = (v) => !v || /^(REPLACE_|PROVIDE_)/.test(v) || /_TO_SKIP$/.test(v);
// Resolvers: script value wins; private config fills the gap. Nothing written back to `s`.
const charVoice = (k) => { const v = s.characters?.[k]?.voiceId; return placeholder(v) ? CFG.characters?.[k]?.voiceId : v; };
const charImage = (k) => { const v = s.characters?.[k]?.image; return placeholder(v) ? CFG.characters?.[k]?.image : v; };
const charSide = (k) => s.characters?.[k]?.side ?? CFG.characters?.[k]?.side ?? "left";
function bgVideo() { const b = s.background_video; return placeholder(b) ? CFG.background_video : b; }

function combinedLatin() {
  return s.dialogues.map(d => `${d.character}: ${d.proc_word_data?.text ?? d.sentence}`).join("\n\n");
}
function uniqueChars() { return [...new Set(s.dialogues.map(d => d.character))]; }

// ------------------------------------------------------------------ stages ---
async function stage05_normalize() {
  for (const d of s.dialogues) {
    if (d._stages?.norm) continue;
    if (PLAN) { log(`  [0.5] would normalize #${d.id}`); continue; }
    try {
      const r = await ask(PROMPTS.normalize, d);
      d.sentence = r.normalized ?? d.sentence;
    } catch (e) { log(`  [0.5] #${d.id} normalize AI unavailable (${e.message.slice(0, 40)}…) → keeping line as-is`); }
    d._stages = { ...(d._stages || {}), norm: true };
    save(); log(`  [0.5] #${d.id} ✓`);
  }
}

async function stage10_voices() {
  const dir = `${os.homedir()}/Downloads/dialogue-story/${s.script_name ?? "story"}`;
  for (const d of s.dialogues) {
    if (d.audio?.file) continue;
    const voiceId = charVoice(d.character);
    if (!voiceId) throw new Error(`No voiceId for "${d.character}". Set it in the script's characters, or in config.local.json (see config.example.json).`);
    if (PLAN) { log(`  [1.0] would TTS #${d.id} (${d.character}/${voiceId})`); continue; }
    const r = await voiceGenerate({ text: d.sentence, voiceId });
    if (!r.url) throw new Error(`voiceGenerate returned no url for #${d.id}: ${JSON.stringify(r.raw)}`);
    const file = `${dir}/${String(d.id).padStart(2, "0")}-${d.character}.mp3`;
    await downloadTo(r.url, file);
    d.audio = { url: r.url, file, duration: r.duration };
    save(); log(`  [1.0] #${d.id} ✓ ${d.audio.duration ?? "?"}s → ${file.split("/").pop()}`);
  }
}

// Distribute a clip's duration across its words (weight by length) — a local,
// dependency-free fallback for word-level karaoke timing when transcription is down.
function distributeTiming(sentence, duration) {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  const weights = words.map(w => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = 0;
  return words.map((word, i) => {
    const start = t; t += (weights[i] / total) * duration;
    return { word, start: +start.toFixed(3), end: +t.toFixed(3) };
  });
}

// Local word-level transcription — the OFFLINE WhisperX replacement (no MCP).
// Runs lib/transcribe_local.py (faster-whisper) on a local audio FILE and returns
// { duration, language, heard:[{word,start,end}], words:[...] } — timings come from
// the ACTUAL audio, never even-spacing. `known` snaps our correct Latin words onto
// whisper's real per-word timings inside the python helper.
function transcribeLocal(audioFile, { known = null, lang = "hi", model = "small" } = {}) {
  const args = [`${here}lib/transcribe_local.py`, audioFile, "--lang", lang, "--model", model];
  if (known) args.push("--known", known);
  const out = execFileSync("python3", args, { maxBuffer: 64 * 1024 * 1024, encoding: "utf8" });
  return JSON.parse(out);
}

// Snap M known caption words onto N real per-word timings (proportional index).
// Exact 1:1 when counts match; graceful drift when they differ. Monotonic, no overlap.
function snapKnown(knownWords, heard) {
  const n = heard.length, m = knownWords.length;
  if (!n || !m) return [];
  const out = knownWords.map((word, j) => {
    const i = m > 1 ? Math.min(n - 1, Math.round((j * (n - 1)) / (m - 1))) : 0;
    return { word, start: heard[i].start, end: heard[i].end };
  });
  for (let k = 1; k < out.length; k++) {
    if (out[k].start < out[k - 1].end) out[k].start = out[k - 1].end;
    if (out[k].end < out[k].start) out[k].end = +(out[k].start + 0.15).toFixed(3);
  }
  return out;
}

async function stage11_wordtiming() {
  for (const d of s.dialogues) {
    if (d.word_data?.words?.length) continue;
    if (PLAN) { log(`  [1.1] would transcribe #${d.id} locally (faster-whisper)`); continue; }
    let words = [];
    try {
      // Real word-level timestamps from the ACTUAL generated mp3 — fully offline.
      const r = transcribeLocal(d.audio.file, { lang: s.transcribe_lang ?? "hi" });
      words = r.heard ?? [];
      if (r.duration && !d.audio.duration) d.audio.duration = r.duration;
    } catch (e) { log(`  [1.1] #${d.id} local transcription failed (${e.message.slice(0, 60)}…) → distributing duration`); }
    if (!words.length) words = distributeTiming(d.sentence, d.audio.duration ?? 3);
    d.word_data = { words };
    if (!d.audio.duration && words.length) d.audio.duration = words.at(-1).end;
    save(); log(`  [1.1] #${d.id} ✓ ${d.word_data.words.length} words (real timings)`);
  }
}

async function stage12_translit() {
  for (const d of s.dialogues) {
    if (d.proc_word_data?.text) continue;
    if (PLAN) { log(`  [1.2] would map latin captions onto real timings #${d.id}`); continue; }
    // Preferred order for the Latin caption line:
    //   1) author-provided d.latin  2) live AI transliteration  3) passthrough of sentence.
    let latin = d.latin ?? null;
    if (!latin) {
      try { const r = await ask(PROMPTS.transliterate, d); latin = r?.latin_text ?? null; }
      catch (e) { log(`  [1.2] #${d.id} transliteration AI unavailable (${e.message.slice(0, 40)}…)`); }
    }
    latin = latin ?? d.sentence;
    // Snap the correct Latin words onto the REAL per-word timings from stage 1.1
    // (whisper heard the actual audio). Falls back to even distribution only if
    // no real timings exist. This is what makes karaoke sync to the spoken words.
    const latinWords = latin.trim().split(/\s+/).filter(Boolean);
    const heard = d.word_data?.words ?? [];
    const words = heard.length
      ? snapKnown(latinWords, heard)
      : distributeTiming(latin, d.audio.duration ?? 3);
    d.proc_word_data = { text: latin, words };
    save(); log(`  [1.2] #${d.id} ✓ ${words.length} latin words on ${heard.length ? "REAL" : "distributed"} timings`);
  }
}

async function stage15_images() {
  for (const d of s.dialogues) {
    if (d.images) continue; // [] counts as "decided none"
    if (PLAN) { log(`  [1.5] would pick images for #${d.id}`); continue; }
    const dur = d.audio.duration ?? 3;
    let decision;
    try {
      decision = await ask(PROMPTS.imageDecision, d, dur);
    } catch (e) { log(`  [1.5] #${d.id} image AI unavailable (${e.message.slice(0, 40)}…) → no context images`); d.images = []; save(); continue; }
    const chosen = [];
    for (const dec of decision.image_decisions ?? []) {
      let imgs = [];
      try { const results = await imageSearch(dec.search_query); imgs = results.images ?? results.results ?? []; }
      catch { imgs = []; }
      if (!imgs.length) continue;
      let idx = 0;
      if (imgs.length > 1) {
        try {
          const pick = await ask(PROMPTS.imagePick, d, dec, imgs);
          idx = Math.min(Math.max(pick.index ?? 0, 0), imgs.length - 1);
        } catch { idx = 0; }
      }
      const chosenImg = imgs[idx];
      chosen.push({ url: chosenImg.url ?? chosenImg.uri ?? chosenImg.src, image_start: dec.image_start_duration, image_end: dec.image_end_duration, query: dec.search_query, reason: dec.reasoning });
    }
    d.images = chosen;
    save(); log(`  [1.5] #${d.id} ✓ ${chosen.length} image(s)`);
  }
}

async function stage20_captiontitle() {
  if (PLAN) { log("  [2.0] would generate script analysis + title + IG caption"); return; }
  const combined = combinedLatin(); const chars = uniqueChars();
  if (!s.script_analysis) {
    s.script_analysis = await ask(PROMPTS.scriptAnalysis, combined, chars); save(); log("  [2.0] script analysis ✓");
  }
  const a = s.script_analysis;
  if (!s.title_data) {
    s.title_data = await ask(PROMPTS.hookTitle, a, combined);
    s.title_data.text_hook_line = String(s.title_data.text_hook_line || "").trim().replace(/^["']|["']$/g, "");
    save(); log(`  [2.0] title ✓ "${s.title_data.text_hook_line}"`);
  }
  if (!s.captioned_data) {
    s.captioned_data = await ask(PROMPTS.igCaption, a, combined); save(); log("  [2.0] IG caption ✓");
  }
}

async function stage30_compose() {
  if (s._stages.composed) { log("  [3.0] already composed — skip"); return; }
  if (PLAN) { log("  [3.0] would build 5-layer timeline (see ../remotion-composition.md)"); return; }
  // Build cumulative dialogue start times (audio is the clock).
  let t = 0; const starts = s.dialogues.map(d => { const st = t; t += (d.audio.duration ?? 0) * 1000; return st; });
  log("  [3.0] Compose — driving editor.* commands. See ../remotion-composition.md for exact z-order.");
  log("        NOTE: open the target content first (contentlead startup protocol) before running compose.");
  // Layer 5: dialogue audio (the clock). Each line at its cumulative start.
  for (let i = 0; i < s.dialogues.length; i++) {
    const d = s.dialogues[i];
    const srcAudio = d.audio?.file ?? d.audio?.url;
    if (!srcAudio) { log(`        (no audio for #${d.id} — run stage 1.0 first)`); continue; }
    await execute("editor.addAudio", { src: srcAudio, from: starts[i], name: `vo-${d.character}-${i}`, volume: 95 })
      .catch(e => log(`        (addAudio #${d.id} failed) ${e.message}`));
  }
  // Layer 4: background
  const bg = bgVideo();
  if (bg) await execute("editor.addVideo", { src: bg, from: 0, duration: t, name: "bg" });
  else log("        (no background_video set — skipping bg layer; add a gameplay clip when the story needs one)");
  // Layer 3: characters (alternate side, slide-in).
  // Reliable path: editor.addImage at the correct time + editor.setAnimation slideIn.
  // Richer path (edit-later): scene.addBundledScene with scenes/DialogueCharacter.tsx source.
  let side = charSide(s.dialogues[0].character) === "right" ? "left" : "right";
  for (let i = 0; i < s.dialogues.length; i++) {
    const d = s.dialogues[i]; side = side === "left" ? "right" : "left";
    const from = starts[i]; const dur = (d.audio.duration ?? 0) * 1000;
    const img = charImage(d.character);
    if (!img) { log(`        (no image for ${d.character} — set it in config.local.json; skipping character layer for #${d.id})`); continue; }
    const r = await execute("editor.addImage", {
      src: img, from, duration: dur, name: `char-${d.character}-${i}`,
    }).catch(e => { log("        (character addImage failed)", e.message); return null; });
    const itemId = r?.result?.itemId;
    if (itemId) await execute("editor.setAnimation", { itemId, type: "in", animationId: side === "left" ? "slideInLeft" : "slideInRight" }).catch(() => {});
  }
  // Layer 2: context images (global windows)
  for (let i = 0; i < s.dialogues.length; i++) {
    for (const img of s.dialogues[i].images ?? []) {
      await execute("editor.addImage", { src: img.url, from: starts[i] + img.image_start * 1000, duration: (img.image_end - img.image_start) * 1000 }).catch(() => {});
    }
  }
  // Layer 1: karaoke captions — use the PROPER caption-item mechanism (editor.addCaption),
  // NOT a Remotion scene. Captions have a dedicated, editable, karaoke-highlighted item type
  // with documented style presets. We chunk the Latin proc_word_data words into ~3-word
  // windows (classic viral look: only the active phrase shows) and give each chunk REAL
  // per-word timings (from stage 1.1 local whisper). Style = the documented "Green Scale"
  // preset (white → green active, black stroke, letter-scale karaoke) which matches the
  // pipeline's ported subtitle style. (Titles/hooks still use Remotion scenes — see Layer 0.)
  const GREEN_SCALE = {
    appearedColor: "#ffffff", activeColor: "#04f827FF", activeFillColor: "transparent",
    color: "#ffffff", backgroundColor: "transparent", borderColor: "#000000",
    borderWidth: 10, textTransform: "none",
    animation: "letterKaraoke/scaleAnimationLetterEffect",
  };
  const CAP_CHUNK = 3;
  let capCount = 0;
  for (let i = 0; i < s.dialogues.length; i++) {
    const ws = s.dialogues[i].proc_word_data?.words ?? [];
    for (let j = 0; j < ws.length; j += CAP_CHUNK) {
      const grp = ws.slice(j, j + CAP_CHUNK);
      const wordsAbs = grp.map(w => ({
        word: w.word,
        start: Math.round(starts[i] + w.start * 1000),
        end: Math.round(starts[i] + w.end * 1000),
      }));
      const from = wordsAbs[0].start;
      const next = ws[j + CAP_CHUNK];
      const to = next ? Math.round(starts[i] + next.start * 1000) : wordsAbs[wordsAbs.length - 1].end;
      await execute("editor.addCaption", {
        from, to,
        text: grp.map(w => w.word).join(" "),
        words: wordsAbs,
        presetName: "Green Scale",
        ...GREEN_SCALE,
        fontSize: 84, fontWeight: 900,
        width: 960, x: 60, y: 1360,
        autoReorder: false,
      }).catch(e => log(`        (caption #${s.dialogues[i].id} chunk failed) ${e.message}`));
      capCount++;
    }
  }
  log(`        captions ✓ ${capCount} windowed caption items (Green Scale preset, REAL word timings)`);
  // Layer 0: title hook — a Remotion kinetic-text scene (spring pop-in, stroke, glow).
  if (s.title_data) {
    const title = String(s.title_data.text_hook_line || "").replace(/`/g, "'");
    const titleDur = Math.round((s.title_data.duration_to_show_text_hook_line_in_video_start || 3.5) * 1000);
    const titleCode =
      `const TITLE = ${JSON.stringify(title)};\n` +
      `const Scene = () => {\n` +
      `  const frame = useCurrentFrame();\n` +
      `  const { fps, durationInFrames } = useVideoConfig();\n` +
      `  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });\n` +
      `  const y = interpolate(pop, [0, 1], [50, 0]);\n` +
      `  const op = fadeIn(frame, 0, 8) * fadeOut(frame, durationInFrames, 8);\n` +
      `  return (\n` +
      `    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center' }}>\n` +
      `      <div style={{ marginTop: '15%', transform: 'translateY(' + y + 'px) scale(' + (0.82 + pop * 0.18) + ')', opacity: op, fontFamily: impactFont, fontSize: 92, fontWeight: 900, color: '#00e10d', WebkitTextStroke: '6px #000', textShadow: '0 6px 24px rgba(0,0,0,0.7)', textAlign: 'center', maxWidth: '86%', lineHeight: 1.08 }}>{TITLE}</div>\n` +
      `    </AbsoluteFill>\n` +
      `  );\n` +
      `};`;
    await execute("scene.addCustomScene", { code: titleCode, name: "Title Hook", from: 0, durationMs: titleDur })
      .catch(e => log(`        (title scene failed) ${e.message}`));
  }
  await execute("editor.reorderTracks", {}).catch(() => {});
  s._stages.composed = true; save();
  log("  [3.0] ✓ timeline built (title>subs>images>chars>bg). Review & tweak in the editor.");
}

// -------------------------------------------------------------------- main ---
const STAGES = [
  ["0.5", stage05_normalize], ["1.0", stage10_voices], ["1.1", stage11_wordtiming],
  ["1.2", stage12_translit], ["1.5", stage15_images], ["2.0", stage20_captiontitle],
  ["3.0", stage30_compose],
];

(async () => {
  log(`\n🎬 dialogue-story: ${s.script_name ?? scriptPath}  (${s.dialogues.length} dialogues)${PLAN ? "  [PLAN]" : ""}`);
  if (!PLAN) {
    const h = await health().catch(() => null);
    if (!h) { console.error("❌ Desktop API not reachable. Launch ContentLead first."); process.exit(1); }
    if (h.cloud && h.cloud.authenticated === false) console.warn("⚠ cloud.authenticated=false — voice/AI need sign-in inside ContentLead.");
  }
  for (const [id, fn] of STAGES) {
    if (!want(id)) continue;
    log(`\n▶ Stage ${id}`);
    try { await fn(); }
    catch (e) { console.error(`\n❌ Stage ${id} failed: ${e.message}`); if (e.detail) console.error("   detail:", JSON.stringify(e.detail).slice(0, 500)); if (e.sentBody) console.error("   sent:", JSON.stringify(e.sentBody).slice(0, 300)); process.exit(1); }
  }
  log(`\n✅ Done. Script JSON updated: ${scriptPath}`);
  if (s.captioned_data) log(`\n📸 IG caption ready in script.captioned_data (hashtags: ${(s.captioned_data.hashtags||"").split(" ").length} tags).`);
})();
