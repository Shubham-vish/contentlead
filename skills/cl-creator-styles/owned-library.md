# Personal styles and media library

These JSON bridges require an updated Desktop integrating the creator-media
route allowlist. Authenticate using `cl-editor`; a skill file alone does not
install routes. Check HTTP status/errors, and never retry uncertain writes
without inspecting saved state.

## Personal style library (not the public creator catalog)

| Desktop endpoint | Payload / result |
|---|---|
| `GET /api/bridge/styles/user` | `{items,total}`; optional `filter=all`, `filter=tag&tag=...`, or `filter=search&q=...` |
| `POST /api/bridge/styles/user` | `{contentId,name,tags?,description?,visibility?,autoGenerateSemantic?}` captures the owner's saved timeline |
| `GET /api/bridge/styles/user/:id` | Owned style document |
| `PUT /api/bridge/styles/user/:id` | Editable `name`, `description`, `tags`, `visibility`, `semanticLayer`, `episodeInputs` |
| `DELETE /api/bridge/styles/user/:id` | Delete owned style with explicit user intent; no timeline undo |
| `POST /api/bridge/styles/user/:id/enrich-semantic` | Explicitly authorized BYO LLM: `llm_config:{base_url,api_key,model,temperature?,max_tokens?}`, optional `sections`, `overwrite` |

Capture requires a saved editable design and an existing completed render
sample. It may upload sample/thumbnail assets; do not invoke it as a harmless
read or claim a missing-render project was captured. Enrichment can spend
provider credits and partially fill sections: inspect `updated`, `skipped`,
`errors` and the returned style. Do not print/store provider keys in evidence.
Public `scene.*Style*` commands are a different catalog, not aliases for these
personal-library endpoints.

## Durable uploaded-media records

- `GET /api/bridge/assets?contentId=...&type=video&offset=0&limit=200`
  lists the owner's records (`limit` 1–500). Omit contentId for cross-content
  owned media. `type`: image/video/audio/document/other. `total` is returned
  page length, not an all-library count; page using offset.
- `POST /api/bridge/assets` registers **already uploaded** media:
  required `contentId`, `name`, durable HTTP(S) `blobUrl`, `type`;
  optional `fileName`, `fileSize`, `mimeType`, `sasUrl`,
  `downloadableSasUrl`, `sasExpiresAt`, `source` (editor/assets-panel),
  `duration` (seconds). This is metadata registration, not file upload or
  timeline insertion. Blob/data URLs are rejected.
- `DELETE /api/bridge/assets?id=...` deletes the authorized owner's library
  record, not necessarily its underlying blob and not existing timeline clips.
  Missing records return an error rather than a false deletion receipt.

Use the existing media-upload flow before registration, refresh expiring signed
URLs as appropriate, then use `editor.addImage`/`addVideo`/`addAudio` with explicit
track intent. Library registration does not make an unreachable URL usable.
