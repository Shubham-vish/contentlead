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

## Renderer Batch Execution (Not a Transaction)

Send `batch.execute` through the usual explicitly tab-targeted `/api/execute`
route. The canonical child list is `params.commands`:

```json
{
  "type": "batch.execute",
  "params": {
    "commands": [
      { "type": "editor.addText", "params": { "text": "A" } },
      { "type": "editor.addText", "params": { "text": "B" } }
    ],
    "expectedContentId": "chosen-content",
    "stopOnError": true
  }
}
```

Accepts 1–50 children; rejects nested batches, unsupported names, malformed child
params and conflicting content assertions before dispatching any child. Defaults
to stopping after the first failed child; `stopOnError:false` explicitly continues.
Receipts include `subResults`, `totalCommands`, `completedCommands`, `stoppedAt`
and `atomic:false`. No automatic rollback, cancellation or safe replay is promised.

Desktop HTTP `/api/batch` is a different transport contract; consult
`desktop-bridge-routes.md`. Do not transfer a transport `transaction` flag to this
renderer command. See `workflow-readiness.md` for content pinning and retry safety.
