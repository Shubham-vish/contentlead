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

You can set volume using the linear 0-100 scale, or the professional dB scale.

### `editor.setVolume` (0-100 scale)
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
Measure LUFS and true peak of a timeline segment to verify levels.
```json
{ "type": "query.getAudioLoudness", "params": { "fromMs": 0, "toMs": 5000 } }
```

## EQ & Audio Enhance

### `audio.setEq`
Apply a 3-band equalizer (Low, Mid, High gains in ±12 dB).
```json
{ "type": "audio.setEq", "params": {
  "itemId": "vid_123",
  "enabled": true,
  "preset": "vocal-boost", 
  "low": -2.0,
  "mid": 3.0,
  "high": 1.5
}}
```
*Valid presets: `flat`, `vocal-boost`, `bass-boost`, `treble-boost`, `podcast`, `reduce-rumble`.*

### `audio.removeEq`
```json
{ "type": "audio.removeEq", "params": { "itemId": "vid_123" } }
```

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
