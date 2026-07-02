# Track Management & Z-Order

Commands for organizing the timeline into tracks, controlling layer visibility, and track linking.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**Track 0 = TOP/front-most layer.** 
Items on lower-indexed tracks render IN FRONT of items on higher-indexed tracks.

- **Top tracks (0, 1...):** Text, Captions, Overlays
- **Middle tracks:** Audio, SFX
- **Bottom tracks:** Video, Background Scenes

If text ends up on a track below a background scene, the background will cover the text, making it invisible.

### `editor.reorderTracks`
Always call this after adding a batch of items to fix the Z-order automatically.
```json
{ "type": "editor.reorderTracks", "params": {} }
```

## Track Commands

### `editor.renameTrack`
Label tracks so you know what's on them.
```json
{ "type": "editor.renameTrack", "params": { "trackId": "track_abc", "name": "🎵 Music" } }
```

### `editor.muteTrack` / `editor.hideTrack` / `editor.lockTrack`
```json
{ "type": "editor.muteTrack", "params": { "trackId": "track_abc", "muted": true } }
{ "type": "editor.hideTrack", "params": { "trackId": "track_abc", "hidden": true } }
{ "type": "editor.lockTrack", "params": { "trackId": "track_abc", "locked": true } }
```

## Track Linking

Linking tracks ensures that when you split, cut, or delete items on the primary track, the time-aligned items on the linked tracks are also affected. This is crucial for keeping A-roll (video) and B-roll/Audio synced during cuts.

### `editor.linkTracks`
```json
{ "type": "editor.linkTracks", "params": {
  "trackIds": ["track_video", "track_audio"]
}}
```

### `editor.unlinkTracks`
```json
{ "type": "editor.unlinkTracks", "params": { "trackIds": ["track_video"] } }
```
