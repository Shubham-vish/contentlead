---
name: cl-apps
description: Upload, host and manage a creator's Creator Apps — static websites/SPAs served publicly at contentlead.in/apps/<slug> — from any AI agent through the ContentLead desktop bridge. Owns the WHOLE catalogue lifecycle: upload/replace a local folder or .zip, list/inspect apps, rename + set slug + set entry file, publish/unpublish, get the public URL, get an owner-only styled preview of a draft, create/revoke an unlisted "anyone with the link" share URL, and delete. NOT the video editor (that is cl-editor), NOT sales pages (cl-offers), NOT the bio page (cl-creator-biopage), NOT the docs hub (cl-creator-hub).
tags: contentlead, creator-apps, app-hosting, static-apps, static-site, spa, html, upload, zip, folder, publish, preview, share-link, command-bus, desktop-bridge, apps.list, apps.upload
---

# cl-apps — Host & manage static Creator Apps at contentlead.in/apps/<slug>

> **Owns the question:** *"How do I UPLOAD a static site (folder or .zip) and manage a user's whole Creator-Apps catalogue — publish, preview a draft, share unlisted, rename, set entry file, delete — from an AI agent?"*
> **Delegates to / NOT:** the desktop **video editor** → `cl-editor`; **sales/checkout pages** → `cl-offers`; **link-in-bio page** → `cl-creator-biopage`; **docs / knowledge base** → `cl-creator-hub`. This skill owns **hosted static apps only**.

## 1. What Creator Apps are

A **Creator App** is any **static website** a signed-in user uploads. Its files live in Azure Blob and it is served publicly at:

```
https://contentlead.in/apps/<slug>
```

- **What can be uploaded:** any static site — a **single `index.html`**, a **multi-page** site, or a **client-side SPA** (React/Vite/Svelte build output, etc.). No server code runs; it's static file hosting.
- **Allowed file types** (served with the correct `Content-Type`; see `SkillTown/lib/app-hosting/contentTypes.ts`): `.html/.htm`, `.css`, `.js/.mjs`, `.json/.map`, `.xml`, `.txt`, `.csv`, `.webmanifest`, `.wasm`; images `.png .jpg .jpeg .gif .webp .avif .svg .ico .bmp`; fonts `.woff .woff2 .ttf .otf .eot`; media `.mp3 .wav .ogg .mp4 .webm`; docs `.pdf`. Any other extension is still hosted but served as a download (`application/octet-stream`), never sniffed as HTML.
- **Entry file** is auto-detected — a root **`index.html`** is preferred. Override it later with `apps.setEntryPath`.
- **Caps** (source of truth: `SkillTown/lib/app-hosting/constants.ts` — the server enforces them; the bridge does a friendly pre-check):
  - Max files per app: **800**
  - Max size per file: **25 MB**
  - Max total (decompressed) per app: **200 MB**
  - Max `.zip` archive (or summed folder) size: **120 MB**
- **Junk auto-skipped:** `__MACOSX/`, `.DS_Store`, `Thumbs.db`. The bridge folder-walk additionally skips heavy dev dirs: `.git`, `node_modules`, `.next`, `.turbo`, `.cache`, `.vscode`, `.idea` — so you can point it at a project checkout and it uploads only the site.

### Lifecycle & visibility

| State | Who can see it | How |
|---|---|---|
| **DRAFT** (default after upload) | Owner only | `apps.getPreviewUrl` → styled owner-only preview link |
| **DRAFT + share link** | Anyone with the unlisted URL | `apps.createShareLink` → capability URL; `apps.revokeShareLink` kills it |
| **PUBLISHED** | Everyone at `/apps/<slug>` | `apps.publish` (→ `apps.unpublish` returns it to DRAFT) |

Identity is **always** the signed-in session user. Every command is owner-scoped server-side — **never** pass an `ownerUserId`.

## 2. Connect through the desktop bridge

All calls go to the **local** ContentLead desktop bridge, which attaches the signed-in web session cookies for you. Read the discovery file each session — the port + token change on restart:

> **⚙️ Is the ContentLead app running?** These calls need `~/.skilltown-desktop/api.json`. If it's missing, the desktop app isn't running — start it, then wait ~30s: **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. Only ask the user if it still doesn't come up.

```bash
API=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write("http://127.0.0.1:"+c.port)')
TOKEN=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write(c.token)')
```

Every call uses the bridge token header:

```bash
-H "Authorization: Bearer $TOKEN"
```

The user must be **signed in to ContentLead** in the desktop app — the bridge forwards those cookies to the web app (`contentlead.in` in cloud mode, `localhost:3000` in dev). If a call returns `not_authenticated` / HTML, the session is stale — the bridge auto-refreshes once; if it still fails, have the user sign in.

## 3. Upload a local folder or .zip  →  `POST /api/bridge/apps/upload-local`

This is the only byte-upload path. Give it an **absolute** local path to a **folder** OR a **`.zip`**.

```
POST http://127.0.0.1:$PORT/api/bridge/apps/upload-local
Authorization: Bearer $TOKEN
Content-Type: application/json

{ "path": "/Users/me/sites/calculator", "title": "Launch Calculator" }
```

Body fields:

| Field | Required | Meaning |
|---|---|---|
| `path` | ✅ | Absolute path to a folder **or** a `.zip`. `~` is expanded. |
| `appId` | — | To **replace the files** of an existing app you own (keeps its slug/URL). Omit to create a new app. |
| `title` | — | Display title (also seeds the slug for a new app). |

Example (create new from a folder):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/apps/upload-local" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path":"/Users/me/sites/calculator","title":"Launch Calculator"}'
```

Example (upload a `.zip`):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/apps/upload-local" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path":"/Users/me/Downloads/site.zip"}'
```

Returns the web app's JSON verbatim:

```json
{
  "app": { "id": "app_123", "slug": "launch-calculator", "title": "Launch Calculator",
           "status": "DRAFT", "entryPath": "index.html", "publicUrl": "/apps/launch-calculator" },
  "warnings": ["Skipped an illegal path: ../evil"]
}
```

**Behaviour & errors:** a folder is walked recursively; each file becomes a `files` part with its POSIX-relative path in an index-aligned `relPaths` array (this is exactly the shape `SkillTown/app/api/apps/upload/route.ts` expects). A `.zip` is attached as the `zip` part and unwrapped server-side (a single common root folder is stripped). The bridge pre-checks file count / per-file / total / archive caps and returns a clear `{error,message}` for: `path_not_found`, `invalid_path` (not a dir or `.zip`), `empty`, `too_many_files`, `file_too_large`, `too_large`, and forwards any web `4xx/5xx` (e.g. `413` too large, `409` slug conflict, `404` app not found) verbatim. Always surface `warnings` to the user.

## 4. Manage the catalogue  →  `apps.*` command bus

Discovery manifest:

```bash
curl -s "http://127.0.0.1:$PORT/api/bridge/apps/commands" -H "Authorization: Bearer $TOKEN"
```

Run one command (note the `{ "params": {...} }` envelope):

```bash
curl -s -X POST "http://127.0.0.1:$PORT/api/bridge/apps/commands/<commandName>" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"params":{ ... }}'
```

Responses are `{ "ok": true, "data": {...} }` on success or `{ "ok": false, "error": "..." }` on failure. Owner-scoped — missing/non-owned apps return `App not found.`

| Command | Params | Returns |
|---|---|---|
| `apps.list` | `{}` | `{ apps: HostedAppDto[] }` |
| `apps.get` | `{ appId }` | `{ app }` (inspect `htmlFiles` before changing entry) |
| `apps.rename` | `{ appId, title?, slug?, entryPath? }` | `{ app }` — slug conflict → `That URL is already taken.` |
| `apps.setEntryPath` | `{ appId, entryPath }` | `{ app }` — must be an HTML file that belongs to the app |
| `apps.publish` | `{ appId }` | `{ app }` — status → `PUBLISHED`, live at `/apps/<slug>` |
| `apps.unpublish` | `{ appId }` | `{ app }` — status → `DRAFT` |
| `apps.getPublicUrl` | `{ appId }` | `{ url: "https://contentlead.in/apps/<slug>" }` |
| `apps.getPreviewUrl` | `{ appId }` | `{ previewUrl }` — styled **owner-only** preview of a DRAFT |
| `apps.createShareLink` | `{ appId }` | `{ shareUrl, shareId }` — unlisted "anyone with the link" URL |
| `apps.revokeShareLink` | `{ appId }` | revokes the share link |
| `apps.delete` | `{ appId }` | `{ ok: true }` — removes metadata + best-effort blob cleanup (only when explicitly asked) |

> `apps.getPreviewUrl`, `apps.createShareLink`, `apps.revokeShareLink` are the newer draft-sharing commands — use `apps.list`/the manifest to confirm they're present in the running build.

### Example payloads

```json
// apps.list
{ "params": {} }

// apps.rename (retitle + change public slug)
{ "params": { "appId": "app_123", "title": "Launch Calculator", "slug": "launch-calculator" } }

// apps.setEntryPath (SPA/build output nested under dist/)
{ "params": { "appId": "app_123", "entryPath": "dist/index.html" } }

// apps.publish
{ "params": { "appId": "app_123" } }
```

## 5. End-to-end recipes

**A. Upload a folder and publish it**
1. `POST /api/bridge/apps/upload-local { "path": "/abs/site", "title": "My App" }` → note `app.id`.
2. (optional) `apps.setEntryPath { appId, entryPath: "dist/index.html" }` if the entry isn't a root `index.html`.
3. `apps.publish { appId }`.
4. `apps.getPublicUrl { appId }` → share `https://contentlead.in/apps/<slug>`.

**B. Replace an existing app's files (keep the URL)**
1. `apps.list` → find the `appId`.
2. `POST /api/bridge/apps/upload-local { "path": "/abs/new-build", "appId": "app_123" }` — same slug/URL, new bytes. If it's already PUBLISHED the live site updates.

**C. Preview a draft (styled, owner-only)**
1. Upload (stays DRAFT). 2. `apps.getPreviewUrl { appId }` → open `previewUrl` yourself; don't publish.

**D. Share a draft unlisted, then revoke**
1. `apps.createShareLink { appId }` → send `shareUrl` to a reviewer. 2. When done, `apps.revokeShareLink { appId }`.

## 6. Tips

- Call `apps.list` first to resolve `appId`s; use `apps.get` to inspect `htmlFiles`/`entryPath` before `apps.setEntryPath`.
- For SPAs, ensure the entry is the built `index.html` and that asset paths are relative (so `/apps/<slug>/...` resolves).
- Prefer **`appId` replace** over delete+recreate when iterating — it preserves the slug and any share link.
- Only `apps.delete` when the user explicitly asks; it's destructive.
