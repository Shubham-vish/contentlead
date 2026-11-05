# Expressive voice: performance before processing

Use with [SKILL.md](SKILL.md). This is the shared voice procedure, not a
particular creator's cast, script formula or video style.

## 1. Pick the right lever

| Need | Available approach | Boundary |
|---|---|---|
| Change what the character wants or reveals | Rewrite the spoken words and conversational response | Tags cannot rescue a scene with no emotional stakes |
| Change overall delivery | Advertised `emotion`, or omit/send `null` for automatic | One mood per request; automatic can work better than forcing sad/calm |
| Add a non-word reaction | Insert an exact advertised token at the desired point | A requested exhale is not proof that a natural exhale was generated |
| Hesitation/emphasis | Natural sentence construction, punctuation, a sparse ellipsis | No guaranteed pause duration or per-word emphasis control |
| Pace | Native `speed:1` first; another advertised speed only when wanted | Synthesis speed is not a post-generation time-stretch |
| Character identity | Reuse a saved, authorized voice ID | A new emotion does not require a new clone |
| Exact human acting/timing | An authorized performed recording, or a separately supported speech-to-speech workflow | Not a feature of this text-to-speech bridge; do not silently substitute |
| Match existing footage | The explicit replacement/alignment workflow in section 3a | Alters alignment/pauses locally; do not confuse it with untouched TTS |

Read live `/options` first. The currently reviewed `speech-2.8-hd` registry
advertises happy, sad, angry, fearful, disgusted, surprised and calm, with
MP3/WAV/FLAC and speed 0.5–2. These are a snapshot, not permission to skip discovery.
Automatic mood is JSON `null` or omitted, never `"auto"` / `"neutral"`.

Its advertised reaction names are:
`laughs`, `chuckle`, `coughs`, `clear-throat`, `groans`, `breath`, `pant`,
`inhale`, `exhale`, `gasps`, `sniffs`, `sighs`, `snorts`, `burps`,
`lip-smacking`, `humming`, `hissing`, `emm`, `sneezes`.
Wrap the selected name in parentheses, e.g. `(exhale)`. Only use names present
for the selected live model. No `[whisper]`, `(whisper)` or invented emotions.
Arbitrary parenthesized prose can be spoken rather than treated as an instruction.

Do not add a reaction to every line. Put it where a thought, effort or feeling
causes it. Keep these three things distinct in the script:

- **Spoken text:** words the audience hears.
- **Synthesis request:** exact text including supported tokens, voice, model,
  mood, speed and format.
- **Acting/review notes:** motivation, intended stress, visual reaction, what
  the listener should judge. These are NOT an extra direction prompt to MiniMax.

The Desktop bridge forwards text, voice ID/name, model, emotion, speed and
format (with the documented `audio_format` alias). Do not invent `instructions`,
`style`, `seed`, per-word controls or assume backend-only pitch/volume/sample-rate
fields are exposed through this bridge.

## 2. Script approval and bounded auditions

1. Draft short complete turns: an intention, a response to the other person,
   and a change by the end. Keep visual directions out of spoken text.
2. Record the exact approved script revision and the authorized take count.
   An explicit request to test feasibility can authorize a small audition
   without approving that script for production; label this distinction.
3. Discover options and list owned voices. Reuse the chosen cast. A healthy
   local process is not a signed-in cloud session; check `/api/app/auth` on an
   authentication problem. Never diagnose login with a paid generation/preview.
4. Generate one request per turn at native speed, preferably WAV for lossless
   audition/assembly. Do not split every phrase: it can damage prosody.
5. For the pivotal line, compare a supported mood with automatic delivery using
   identical words/tags/voice/model/speed/format. Change one requested variable.
   Preserve both takes. Independent generations vary stochastically; this is
   not a seeded experiment or proof that mood caused every acoustic difference.
6. Download every successful output immediately. Preserve raw file, SHA-256,
   request, revision/take ID, history ID, measured duration and resolved settings.
   Read history back. Missing history is an explicit persistence failure, not
   permission to regenerate a successful take.
7. Keep a local started/completed request ledger before paid calls. This guards
   accidental local replays; it is not provider-side idempotency. On timeout or
   ambiguous success, inspect existing receipts/history and recover outputs.
   Never automatically repeat generation or cloning.

Do not claim a mood was perceptually successful merely because it was accepted.
The pass condition is listening: intelligibility, character consistency,
motivated reaction, word emphasis and believable response to the previous turn.
Transcripts and pitch/loudness measurements are supporting evidence, not ears.

## 3. Assemble without destroying the test

Keep raw per-line players and a full-scene player. For A/B, reuse every unchanged
line and change only the intended take. Do not time-stretch both to equal length.

For compatible uncompressed signed PCM WAVs:

1. Verify hashes; require matching rate, channel count and sample width.
2. Copy every source frame, including leading/trailing breaths and silence.
3. Add only the approved inter-turn zero-valued gap frames at that sample rate.
   Record added gap duration separately from silence already inside the take.
4. Save to a new path; record each take's start/end and output hash/duration.
5. Read back and compare every source segment sample-for-sample; verify inserted
   gaps and total frame count. Never claim the assembled WAV has the same file
   hash as its sources.

If formats differ, stop transparent assembly or propose a separately labelled
conversion. Decoding MP3, resampling, crossfading, normalizing or encoding an
AAC video soundtrack is not byte-identical passthrough. Keep raw originals.
Let measured delivery set the audition length; tighten writing before speeding
or cutting an emotional reaction just to hit a ten-second target.

## 4. Know which stage processes the audio

The source-audited normal generation path is:

```text
Voice Lab -> speech generation -> MiniMax response
          -> decode hex into audio bytes -> upload those bytes -> return URL
```

No application-side silence/gap removal, normalization, gain, denoising,
compression, resampling or re-encoding runs after receipt in that path.
This says nothing about MiniMax's internal synthesis processing. A local
source audit is not verification of every currently deployed service.

| Other stage | Distinction |
|---|---|
| Clone reference preparation | Clone backend defaults provider noise reduction and volume normalization to true; these operate on reference cloning, not every generated output. They are not advertised bridge generation controls |
| Voice Lab playback | Plays the returned URL; waveform `normalize:true` scales the drawing, not audio |
| Editor insertion | Standard UI insertion uses the full measured take at volume 100; explicit commands can choose other gain |
| Per-source/per-clip processing | Hidden source normalization is a unity-gain no-op in the audited implementation; per-clip Loudness Normalize defaults off. Inspect actual saved settings |
| Editor master bus | Separate from generation; audited default is Instagram -14 LUFS / -0.1 dBTP. Preview/export can therefore sound different from raw audition |
| Silence-removal UI | May automatically analyze candidate cuts; applying cuts is separate. Quiet reactions are not reliably classified by energy or transcript gaps |
| Optional processing endpoint / legacy helper | Explicit separate operations, not called by normal generation. Section 3b explains the helper's trim/boost risks |
| Voice replacement alignment | An explicit local preview/apply workflow may move pauses or alter tempo; it is not raw speech generation |

Measure with `cl-audio` read-only QA. A quiet raw take need not be normalized
before review. Later, create a separate approved master and verify peak,
loudness and preserved soft reactions; never silently overwrite the audition.

## 5. Delivery and approval contract

Provide raw line players, full-scene A/B, exact request settings, notes and
preferred-take feedback. A local HTML page should work with relative assets,
preserve edits across reloads, play one recording at a time and show load errors.
No autoplay and no simulated browser speech presented as generated audio.

Bind approval to exact script and audio hashes. Text/voice/settings changes
invalidate affected approvals; retain old takes visibly as earlier versions.
Feedback export, script approval, vocal approval and permission to create
video are distinct. Do not start paid video because an A/B verdict is promising.

For a flat result, diagnose the narrow failure: empty script, announcer-like
phrasing, overforced mood, missing reaction, clone contamination, or excessive
post-processing. Propose the smallest new audition; don't repeatedly regenerate
the entire cast or hide a weak performance under music.
