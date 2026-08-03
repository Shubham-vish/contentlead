// prompts.example.mjs — PUBLIC template. Generic, functional prompts so the skill
// runs out-of-the-box, WITHOUT the tuned viral wording (that lives in the private,
// gitignored prompts.local.mjs). To use your own: copy this file to prompts.local.mjs
// and refine the wording. run.mjs auto-prefers prompts.local.mjs when present.
//
// Each builder returns { system, user }. `textJson(system, user)` appends the strict-JSON
// instruction, so keep the exact "Return JSON: {…}" shape in `user`.

export const PROMPTS = {
  normalize: (d) => ({
    system: "You normalize short-video dialogue lines. Keep the language and meaning; fix obvious spelling/script inconsistencies. Keep technical terms and acronyms as-is; write numbers as digits.",
    user: `Line: "${d.sentence}"\nReturn JSON: {"normalized":"<cleaned line>"}`,
  }),

  transliterate: (d) => ({
    system: "You convert on-screen caption text to Latin script when needed. Keep the language and meaning; only change the script. Leave already-Latin words unchanged. Numbers as digits; acronyms as-is.",
    user: `Text: "${d.sentence}"\nReturn JSON: {"latin_text":"<full latin>","word_mappings":[{"original_word":"","latin_word":""}]}`,
  }),

  imageDecision: (d, dur) => ({
    system: "You decide how many context images a dialogue needs and when to show them for a short vertical video. Cover most (not all) of the dialogue, each image visible at least ~1-3s, no overlap, concrete concepts only, never character portraits.",
    user: `Dialogue: "${d.proc_word_data.text}"\nAudio Duration: ${dur}\nReturn JSON: {"images_needed":n,"image_decisions":[{"search_query":"","image_start_duration":0,"image_end_duration":0,"reasoning":""}]}`,
  }),

  imagePick: (d, dec, imgs) => ({
    system: "You pick the single best, most relevant, non-watermarked image for the words spoken.",
    user: `Dialogue: "${d.proc_word_data.text}"\nQuery: "${dec.search_query}"\nImages: ${JSON.stringify(imgs.map((im, i) => ({ index: i, description: im.description ?? "" })))}\nReturn JSON: {"index":n,"reason":""}`,
  }),

  scriptAnalysis: (combined, chars) => ({
    system: "You analyze a short-video script's themes and audience.",
    user: `Script: "${combined}"\nCharacters: ${JSON.stringify(chars)}\nReturn JSON: {"main_topic":"","key_concepts":[],"target_audience":"","content_type":"","engagement_style":""}`,
  }),

  hookTitle: (a, combined) => ({
    system: "You write a short (2-5 word) bold on-screen hook title for the first few seconds of a short video. Make it curiosity-driving; emojis are ok.",
    user: `Analysis: ${JSON.stringify(a)}\nScript: "${combined}"\nReturn JSON: {"text_hook_line":"","duration_to_show_text_hook_line_in_video_start":3.5}`,
  }),

  igCaption: (a, combined) => ({
    system: "You write a social caption package for a short video: a main caption with line breaks, a few relevant hashtags, a hook line, and a call to action.",
    user: `Analysis: ${JSON.stringify(a)}\nScript: "${combined}"\nReturn JSON: {"main_caption":"","hashtags":"","hook_line":"","call_to_action":"","text_hook_line":""}`,
  }),
};
