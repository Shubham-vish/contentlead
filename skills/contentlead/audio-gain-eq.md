# Audio, Gain, EQ, and Noise Reduction

Commands for adding audio, mixing volume (dB and linear), applying EQ, and processing noise reduction.

## ⚠️ Browser Audio Limits
The browser can only mount **~5-6 Html5Audio tags simultaneously**. 
Keep total audio items (music + SFX) to ≤ 5. Overlap is fine, but total distinct tracks/items must be small.

## Adding Audio

### `editor.addAudio`
```json
{ "type": "editor.addAudio", "params": {
  "src": "/Users/shubham/Music/bgm.mp3",
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
Get volume/gain info for specific audio items.
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

### Clipping warning
- **Preview clamps at 0 dBFS in browser** — audio never "sounds distorted" in preview even if math would clip
- **Render captures raw math** — volume=400% + heavy EQ boost WILL clip in the MP4
- **No automatic limiter** — user is responsible for volume + EQ combinations that stay ≤0 dBFS peak
- If you need to check: `ffmpeg -i output.mp4 -af ebur128=peak=true:framelog=quiet -f null /dev/null` — Peak should be ≤0 dBFS

### Multi-track SFX architecture
`editor.addAudio` auto-splits SFX across separate tracks based on time-overlap detection. If you add 20 SFX close in time, expect 5-6 audio tracks in the timeline (by design — avoids overlap conflicts).

## Auto-Mixing

### `audio.duckMusic`
Automatically lower music volume where narration/voiceover overlaps. Music tracks are detected by track name (contains "music" or "bg") or low volume (≤40).

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
Set all audio items to role-appropriate volumes. Roles are detected by track name ("music", "sfx", "bg").

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

**Returns:** `{ adjusted: [{id, type, oldVolume, newVolume}] }`

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
