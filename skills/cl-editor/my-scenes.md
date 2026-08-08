# My Scenes — Per-User Saved Scene Library

The editor has a per-user "My Scenes" library for saving custom Remotion scenes
so they can be reused across content. Scenes are stored in Cosmos
(`UserScenes` container, partitioned by `/userId`) and exposed via
`/api/scenes/user` on the SkillTown web app. The AgentCommandQueue exposes six
bridge commands so agents can drive the same UX as the timeline right-click
"Add to My Scenes" flow.

All commands are invoked over the desktop bridge:

```bash
curl -s -X POST "$BASE/api/execute" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"scene.<command>","params":{...},"tabId":"'"$TAB_ID"'"}'
```

## Command Reference

### `scene.saveToMyScenes`
Save a scene from the timeline (by `itemId`) OR from raw code to the current
user's library. When `itemId` is provided, `name`, `sceneProps`, `orientation`,
`durationFrames`, `enterAnim`, and `exitAnim` are auto-extracted from the item
so the result matches the right-click "Add to My Scenes" behaviour.

Params:
- `itemId?: string` — timeline item id of an existing custom scene
- `code?: string` — Remotion JSX source (required if `itemId` is omitted)
- `name?: string`
- `description?: string`
- `tags?: string[]`
- `category?: string` (default `"custom"`)
- `sceneProps?: object`
- `orientation?: "portrait" | "landscape" | "auto"` (default `"portrait"`)
- `durationFrames?: number` (default `150`)
- `enterAnim?`, `exitAnim?`, `playbackRate?`
- `thumbnailUrl?: string`
- `sourceContentId?: string`
- `visibility?: "private" | "org" | "public"` (default `"private"`)

Returns `{ sceneId, name, durationFrames, orientation, createdAt }`.

### `scene.listMyScenes`
List the current user's saved scenes. Returns lightweight metadata (no code)
so it's cheap to paint the panel; use `scene.getMyScene` to fetch the actual
`customSceneCode`.

Params:
- `filter?: string` — category filter, or `"all"` (default)

Returns `{ count, scenes: [{ id, name, description, tags, category, orientation, durationFrames, thumbnailUrl, createdAt, updatedAt, visibility }, ...] }`.

### `scene.getMyScene`
Fetch one saved scene, including its `customSceneCode` and full metadata.

Params:
- `sceneId: string` (required)

Returns `{ scene: UserSceneDocument }`.

### `scene.addMyScene`
Add a saved My Scene onto the current timeline. Delegates to the same code
path as `scene.addCustomScene`, so the item ends up as a normal editable
custom scene on the timeline. Uses the saved `durationFrames` and
`orientation` unless overridden.

Params:
- `sceneId: string` (required)
- `from?: number` — timeline start in ms (default `0`)
- `durationMs?: number` — override the saved duration
- `name?: string` — override display name
- `orientation?: "portrait" | "landscape"` — override saved orientation
- `width?: number`, `height?: number` — explicit scene dimensions

### `scene.updateMyScene`
Update editable metadata on a saved scene. The `customSceneCode` itself is
immutable — re-save via `scene.saveToMyScenes` to create a new version.

Params:
- `sceneId: string` (required)
- Any of: `name`, `description`, `tags`, `category`, `visibility`, `thumbnailUrl`

Returns `{ scene: UserSceneDocument }`.

### `scene.deleteMyScene`
Delete a saved scene from the user's library.

Params:
- `sceneId: string` (required)

Returns `{ sceneId, deleted: boolean }`.

## Typical Workflows

### Save-then-reuse
```
scene.addCustomScene { code, name, from, durationMs }
   → get itemId from response
scene.saveToMyScenes { itemId, tags: ["intro","podcast"] }
   → later, from any content:
scene.listMyScenes { filter: "custom" }
scene.addMyScene { sceneId, from: 0 }
```

### Direct save from generated code (no timeline round-trip)
```
scene.saveToMyScenes { code, name: "Lower third", tags: ["lowerthird"], durationFrames: 90 }
```

### Auth
All six commands hit the SkillTown web API which relies on the currently
signed-in user (cookies). The desktop bridge already forwards these cookies
via `bridgeFetch`, so no extra auth setup is required.

## Related

- Server: `SkillTown/app/api/scenes/user/route.ts`, `SkillTown/app/api/scenes/user/[sceneId]/route.ts`
- Data model: `SkillTown/app/types/userScene.ts`
- Client: `SkillTown/app/content/[content_id]/components/video-editor-v2/menu-item/templates/user-scenes-client.ts`
- Panel: `SkillTown/app/content/[content_id]/components/video-editor-v2/menu-item/templates/MyScenesList.tsx`
- UI trigger: `SkillTown/app/content/[content_id]/components/video-editor-v2/context-menu/itemContextMenu/ItemContextMenu.tsx` (`handleSaveCustomScene`)
- Events: `USER_SCENES_CHANGED_EVENT`, `OPEN_MY_SCENES_EVENT`
