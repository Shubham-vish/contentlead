# Audio, Gain, EQ, and Noise Reduction

Commands for adding audio, mixing volume (dB and linear), applying EQ, and processing noise reduction.

For picture-preserving voice replacement, load `cl-voice` section **3a**.
**Replace voice...** opens the existing **AI > Voice** sidebar with Generate,
Saved speech and Upload sources, Hindi **Match words & preview**, selected-word
Resync / earlier / later / Undo, and manual controls under Advanced. Check
`/api/timing-align/capabilities` and `wordSync.status` before processing; local
word matching needs one-time setup and an updated/restarted desktop. This is separate from adding
a narration track or the audio-only **Match Timing** utility.

## Playback and render checks

Do not infer a universal total-item limit from a browser audio-tag pool. Preview
and render constraints depend on the installed engine and concurrent playback.
Inspect actual diagnostics. Preserve editable cues; use stems only when the
workflow needs them, keeping the source cue worksheet.

## Adding Audio

### `editor.addAudio`
```json
{ "type": "editor.addAudio", "params": {
  "src": "/Users/shubham/Music/bgm.mp3",
  "createNewTrack": true,
  "trackName": "Background music",
  "from": 0,
  "durationMs": 15000,
  "details": { "volume": 35 }
}}
```

## Mixing & Volume

You can set volume using the linear scale (100 = unity; >100 amplifies), or the professional dB scale.

### `editor.setVolume` (linear scale)
```json
{ "type": "editor.setVolume", "params": { "itemId": "aud_123", "volume": 30 } }
```

### `editor.setAudioGain` (dB scale)
Recommended for mixing. Range: -60 dB to 0 dB.
```json
{ "type": "editor.setAudioGain", "params": {
  "itemIds": ["music_1"],
  "gainDb": -12
}}
```

**Common mixing levels:**
- Music (under voice): `-15` to `-12` dB
- Background SFX: `-10` to `-8` dB
- Impact SFX: `-5` to `-3` dB
- Voiceover: `0` dB

### `query.getAudioLoudness`
Get configured volume/gain info for specific audio items. This command does
**not** measure source or rendered LUFS, RMS, sample peak or true peak.
```json
{ "type": "query.getAudioLoudness", "params": { "itemId": "aud_123" } }
// Or multiple: { "itemIds": ["aud_123", "aud_456"] }
```

## EQ & Audio Enhance

### `audio.setEq`
Apply a 3-band equalizer (Low, Mid, High gains in ±12 dB).
```json
{ "type": "audio.setEq", "params": {
  "itemId": "vid_123",
  "enabled": true,
  "preset": "voice-enhance", 
  "low": -2.0,
  "mid": 3.0,
  "high": 1.5
}}
```
*Valid presets: `flat`, `voice-enhance`, `bass-boost`, `podcast`, `warm`, `bright`, `de-mud`, `telephone`.*

### `audio.removeEq`
```json
{ "type": "audio.removeEq", "params": { "itemId": "vid_123" } }
```

## Render Audio Rules (post-2026-07-03 fix)

The render pipeline now processes each audio item's effects (volume, EQ) INDIVIDUALLY, matching what the preview does. Previous versions had a global post-render EQ pass that incorrectly applied one item's filter chain to the entire mixed audio.

### Rules for any future audio effect (compressor, reverb, noise reduction, etc.)
- **Must be applied per-item pre-processing** (not global post-pass)
- **Volume >100% is supported** via Remotion's native `<Video volume={x}>` and `<Audio volume={x}>` — see `electron/design-converter/item-converters.cjs::resolveAudioVolume()`
- **EQ per-item** — see `electron/render-worker.cjs::preProcessItemAudio()` for the pattern (pre-processes source file with ffmpeg, swaps `details.src` before Remotion mixes)

### Clipping and master-bus processing
- Preview sound is not proof of exported peak or loudness compliance.
- Heavy gain/EQ can clip before the final mix; fix per-item levels rather than relying on a final limiter to repair distortion.
- The editor has persisted master-bus loudness/limiter presets. Inspect `query.getMasterBus`; set `audio.setMasterBus` using `workflow-completion.md`. `off` disables that stage. A setting receipt is not a measured export result.
- Measure the encoded export with `cl-audio/audio-review.md`; use the approved
  delivery ceiling and inspect intersample true peak, not just sample peak.

### Multi-track SFX architecture
Legacy auto-placement can allocate additional compatible tracks for overlapping
audio. For deterministic placement, use an existing compatible `trackId`, or
`createNewTrack:true` once and reuse the returned actual owner track for later
items. `trackName` alone does not force fresh ownership.

## Auto-Mixing

### `audio.duckMusic`
Coarsely lower a **whole music item's** volume if any narration item overlaps.
This is not a time-varying sidechain envelope. The current handler considers
audio items, not embedded speech in video items. It classifies music by track
name ("music"/"bg"), `metadata.role:"music"`, or volume <=40; a quiet SFX can be
misclassified. Inspect roles and results before using it.

```json
{ "type": "audio.duckMusic", "params": {
  "duckDb": -12,
  "musicVolume": 30
}}
```

| Param | Type | Default | Description |
|---|---|---|---|
| `duckDb` | `number` | `-12` | How much to reduce music (dB) during narration overlap |
| `musicVolume` | `number` | `30` | Base music volume (0-100) when not ducking |

**Returns:** `{ musicItems, narrationItems, ducked, duckedItemIds, duckAmountDb, musicVolume }`

### `audio.balanceVolumes`
Set audio items to fixed role-appropriate volumes. Roles are detected by track
name ("music", "sfx", "bg") or role metadata. This is not measured loudness
normalization and can overwrite reviewed per-cue gains.

```json
{ "type": "audio.balanceVolumes", "params": {
  "musicVolume": 30,
  "sfxVolume": 50,
  "narrationVolume": 100
}}
```

| Param | Type | Default | Description |
|---|---|---|---|
| `musicVolume` | `number` | `30` | Target volume for music items |
| `sfxVolume` | `number` | `50` | Target volume for SFX items |
| `narrationVolume` | `number` | `100` | Target volume for narration/voiceover items |

**Returns:** `{ targetLevels, adjusted, details: [{id, type, oldVolume, newVolume}] }`

## Noise Reduction (Main Process)

Noise reduction uses ffmpeg to clean up audio files. These commands run in the Electron main process and require **local file paths** (not timeline item IDs or URLs). They write new cleaned files to disk.

1. **Get a noise profile:** Find a 1-2 second segment of "pure room noise" in the file.
2. **`audio.reduceNoise`:** Clean the file using that segment.
3. **`editor.replaceMedia`:** Swap the noisy clip on the timeline for the cleaned one.

### `audio.reduceNoise`
```json
{ "type": "audio.reduceNoise", "params": {
  "sourcePath": "/Users/shubham/raw_take.mp4",
  "profileSegment": [0.5, 2.0],
  "amount": 0.8
}}
```
*Returns the local path to the cleaned audio/video file.*

### Managing Noise Profiles
You can save a noise profile from a specific room/mic to reuse later without needing a silent segment in every take.
- `audio.saveNoiseProfile`: `{sourcePath, profileSegment: [start, end], name}`
- `audio.listNoiseProfiles`: `{}`
- `audio.reduceNoiseWithProfile`: `{sourcePath, profileId, amount}`
