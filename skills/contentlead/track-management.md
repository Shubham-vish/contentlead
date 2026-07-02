# Track Management & Z-Order

Commands for organizing the timeline into tracks, controlling layer visibility, and track linking.

## ⚠️ CRITICAL: Track Z-Order (Layer Visibility)

**Track 0 is the FRONT layer (closest to the viewer).**
**Higher track numbers go BEHIND lower track numbers.**

This is the opposite of some design tools.
- **Track 0:** Front layer (Text, Captions, Overlays)
- **Track 1:** Behind Track 0 (Images, B-Roll)
- **Track 2+:** Background layers (Video, Scenes)

If you place text on Track 3, and a video on Track 0, the video will completely hide the text.

### `editor.reorderTracks` (THE FIX)
Because track math is confusing, the API provides an auto-sorter. **Always call this after adding new items to the timeline.** It automatically moves Text to the front (Track 0) and Videos/Scenes to the back.
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
