# Bulk Operations & Batch Execution

Commands for modifying many items at once.

## Bulk Styling

### `bulk.styleByType`
Apply the same `details` patch to every item of a specific type.
```json
{ "type": "bulk.styleByType", "params": {
  "type": "text", 
  "details": { "fontFamily": "Inter", "color": "#000000" }
}}
```
*Valid types: `text`, `caption`, `video`, `image`, `audio`.*

## Bulk Movement

### `bulk.shiftAll`
Shift every item on the timeline (or specific track/type) left or right by milliseconds.
```json
{ "type": "bulk.shiftAll", "params": {
  "shiftMs": 2000, 
  "type": "video" 
}}
```

## Bulk Deletion

### `bulk.deleteByType`
Delete all items of a specific type.
```json
{ "type": "bulk.deleteByType", "params": { "type": "caption" } }
```

### `editor.clearTimeline`
Nuclear option. Clears the entire timeline, or a specific track.
```json
{ "type": "editor.clearTimeline", "params": { "trackId": "track_abc" } }
```

## Batch Execution (Transactions)

When making multiple API calls, you can send them in one batch to the `POST /api/batch` endpoint.

```json
{
  "commands": [
    { "type": "editor.addText", "params": { "text": "A" } },
    { "type": "editor.addText", "params": { "text": "B" } }
  ],
  "transaction": true
}
```
If `transaction: true`, the editor will automatically `editor.undo` if any command in the batch fails.
