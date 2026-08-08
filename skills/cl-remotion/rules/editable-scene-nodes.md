---
name: editable-scene-nodes
description: Expose stable internal Remotion layers for direct editing in ContentLead
tags: remotion, editable-scene, layers, direct-manipulation
---

# Editable Scene Nodes

Remotion scenes are one parent clip on the project timeline. To let users edit
internal elements without exploding that clip into normal tracks, opt individual
elements into the editable-node contract.

## Authoring contract

Wrap each directly editable element with `EditableSceneNode`. IDs are persisted,
so they must be stable across scene revisions.

```jsx
const Scene = () => (
  <AbsoluteFill style={{ backgroundColor: "#111827" }}>
    <EditableSceneNode
      id="headline"
      label="Headline"
      type="text"
      capabilities={["text", "move", "resize", "rotate", "timing"]}
      defaultTiming={{ startMs: 0, durationMs: 5000 }}
      defaultZ={20}
      style={{ position: "absolute", left: 120, top: 300 }}
    >
      Original headline
    </EditableSceneNode>
  </AbsoluteFill>
);
```

`EditableSceneNode` is an injected global in sandbox scenes. Bundled scenes can
import it:

```tsx
import {EditableSceneNode} from "@shubham-vish/remotion-core/editable-scenes";
```

Keep authored animation transforms on a child inside the wrapper. The wrapper's
outer transform is reserved for editor overrides:

```jsx
<EditableSceneNode id="logo" label="Logo" type="image"
  capabilities={["move", "resize", "rotate", "timing"]}>
  <div style={{ transform: `scale(${authoredSpring})` }}>
    <Img src={logoUrl} />
  </div>
</EditableSceneNode>
```

## Manifest

Pass the same node definitions as `editableManifest` when adding through AI.
This makes Layers and the nested timeline available before the first preview
render. The runtime also discovers wrappers and persists their definitions when
the user enters Scene Edit Mode.

```json
{
  "editableManifest": {
    "nodes": [{
      "id": "headline",
      "label": "Headline",
      "type": "text",
      "capabilities": ["text", "move", "resize", "rotate", "timing"],
      "defaultTiming": {"startMs": 0, "durationMs": 5000},
      "defaultZ": 20
    }]
  }
}
```

Allowed node types: `text`, `image`, `video`, `shape`, `group`, `background`,
and `custom`.

## Editing commands

- `scene.getEditableNodes` — `{itemId}`
- `scene.updateEditableNode` — `{itemId, nodeId, patch}`
- `scene.resetEditableNode` — `{itemId, nodeId}`

Patch fields are `transform`, `props`, `timing`, `visible`, `locked`, `zIndex`,
and `keyframes`. Text nodes use `patch.props.text`.

Nodes are scene-local. Their timing is milliseconds from the scene's source
window, not global project time. Split and trim preserve that source window.

Scenes without wrappers or a manifest remain opaque and continue to support
whole-scene props/code editing. Do not invent DOM-derived IDs or promise direct
editing for arbitrary JSX.
