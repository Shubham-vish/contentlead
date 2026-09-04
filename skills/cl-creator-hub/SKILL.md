---
name: cl-creator-hub
description: Build and manage a creator's documentation Hub at contentlead.in/hub/<handle> from any AI agent. Use for creating/organizing DOCS and FOLDERS in a creator's knowledge base — create/edit/publish/move/delete markdown docs, create/rename/move/delete nested folders, list the tree, read a doc, and AI-generate a doc from a topic. All via one command surface at /api/hub/commands/<name>. Sibling to cl-creator-biopage (the link-in-bio storefront page) and cl-offers (sales pages); this owns the docs/knowledge-base hub, NOT the bio page and NOT the desktop editor (that is cl-editor).
tags: creator hub, hub, docs, documentation, knowledge base, learn, folders, articles, markdown, publish, contentlead.in/hub, hub commands, creator docs, knowledge hub
---

# ContentLead Creator Hub — AI Agent Skill

> **Owns the question:** *"How do I create, organize, write and publish a creator's DOCUMENTATION hub (`/hub/<handle>`) — folders + docs — from an agent?"*
> **Delegates to:** `cl-creator-biopage` (the link-in-bio page), `cl-offers` (sales pages). This skill is their sibling for the **docs / knowledge base**.

Control the **Creator Hub** — the per-creator **documentation / knowledge base** published at `contentlead.in/hub/<handle>`. It's a tree of **folders** and **docs** (markdown or html), each with a publish flag. Public visitors see only published docs; the owner sees drafts too.

Like `cl-creator-biopage` and `cl-offers` (and unlike `cl-editor`, which talks to the desktop app), this runs in the ContentLead **web app**. Commands go to the user's **authenticated session**, not a local port.

---

## 1. What this is (and is NOT)

| Surface | Route | Skill |
|---|---|---|
| **Creator Hub (docs)** ← this skill | `/hub/<handle>/<path>` | `cl-creator-hub` |
| Link-in-bio / storefront page | `/<handle>` | `cl-creator-biopage` |
| Sales / checkout / offer pages | `/offer-studio/*` | `cl-offers` |
| Desktop video editor | local bridge | `cl-editor` |

The Hub is a **knowledge base**: nested folders + markdown docs. It is NOT typed sections, NOT a bio page, NOT checkout.

---

## 2. Prerequisites

The user must be **signed in to `https://contentlead.in`** (agents via the desktop bridge auto-pass session cookies).

- Identity is always the **signed-in session** — you cannot pass a `userId`.
- A **handle is NOT required** to author docs. Docs are scoped to the user id, so you can create/organize them before a handle is claimed — they just aren't publicly reachable until a handle exists. `hub.getState` reports `handle`/`publicUrl` (or a hint to claim one at `/hub`).
- To claim a handle (makes the hub public): `POST /api/user/handle { "handle": "<lowercase-handle>" }` (same endpoint the storefront skill uses).

> **⚙️ Desktop bridge:** if session cookies come from the ContentLead app and it isn't running, start it first — **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"`. If you call `contentlead.in` directly with the user's browser session, no app start is needed.

---

## 3. How to call commands

One command surface, POST per command:

```
GET  /api/hub/commands/<anything>     → returns the full command manifest (names, schemas, examples)
POST /api/hub/commands/<commandName>  { "params": { ... } }
```

- The **GET** on any path returns `{ commands: [...] }` — the live manifest. Use it to discover exact param schemas.
- Every **POST** body is `{ "params": { ... } }`. Params are validated against each command's JSON schema; invalid params return `{ ok:false, error:"Invalid command params", validationErrors:[...] }`.
- Response envelope: `{ ok, command, result: { ok, data, message } }` on success; `{ ok:false, error }` on failure. Auth failures → HTTP 401 `{ ok:false, error:"Authentication required" }`.

Always start a session with `hub.getState` to load the current tree + ids.

```
POST /api/hub/commands/hub.getState   { "params": {} }
```

---

## 4. Command reference (namespace `hub.`)

12 commands, 4 categories. IDs (`folderId`, doc `id`) come from `hub.getState` / `hub.listDocs`.

### state
| Command | Params | Does |
|---|---|---|
| `hub.getState` | — | Full folder tree + root docs + counts (`docs`, `published`, `folders`) + `handle`/`publicUrl`. **Start here.** |

### folder
| Command | Params | Does |
|---|---|---|
| `hub.folder.create` | `name` (req), `parentId?`, `icon?`, `description?` | Create a folder; nest with `parentId`. Name unique within parent. |
| `hub.folder.update` | `id` (req), `name?`, `parentId?` (move), `icon?`, `description?`, `sortOrder?` | Rename / move / re-icon / reorder. |
| `hub.folder.delete` | `id` (req) | Delete; child docs + subfolders **move up to the parent** (nothing lost). |

### doc
| Command | Params | Does |
|---|---|---|
| `hub.listDocs` | `folderId?`, `publishedOnly?` | List up to 200 docs (newest first). Omit `folderId` for all. |
| `hub.getDoc` | `slug?` **or** `id?` | Read one doc's full content (drafts visible to owner). |
| `hub.doc.create` | `title` (req), `content` (req), `description?`, `folderId?`, `tags?[]`, `isPublished?`, `isFeatured?`, `contentType?` (`markdown`\|`html`) | Create a doc. Slug auto-generated + de-duped; reading time auto-computed. Default = **draft**. |
| `hub.doc.update` | `id` (req), + any of `title`, `content`, `description`, `folderId`, `tags[]`, `isPublished`, `isFeatured` | Edit fields. Recomputes reading time when content changes. |
| `hub.doc.publish` | `id` (req), `published?` (default `true`) | Publish / unpublish. Only published docs are public. |
| `hub.doc.move` | `id` (req), `folderId?` (omit → root) | Move a doc between folders; recomputes its path. |
| `hub.doc.delete` | `id` (req) | Permanently delete a doc. |

### generate
| Command | Params | Does |
|---|---|---|
| `hub.doc.generate` | `topic` (req), `folderId?`, `audience?`, `publish?` | LLM writes a structured markdown doc for `topic` (titled from its H1) and saves it (draft by default). |

---

## 5. Data model (what you're editing)

- **Folder** (`LearnFolder`): `{ id, name, slug, fullPath, icon?, description?, parentId?, sortOrder }`, scoped by `userId`. `fullPath` is the nested path (e.g. `guides/api`). Unique per `(userId, fullPath)`.
- **Doc** (`LearningMaterial`): `{ id, slug, title, content, contentType, description?, folderId?, fullPath?, tags[], isPublished, isFeatured, readingTime, ... }`, scoped by `userId`, unique per `(userId, slug)`.
- **Public URL** of a published doc: `/hub/<handle>/<fullPath || slug>`. Create/update responses include this `url` (null if no handle yet).

---

## 6. Publish lifecycle & visibility

- New docs are **drafts** (`isPublished:false`) unless you pass `isPublished:true` / `publish:true`.
- Public `/hub/<handle>` visitors see **only published** docs and folders that contain them; the owner (signed-in) sees drafts too.
- `hub.doc.publish { id }` flips a draft live; `hub.doc.publish { id, published:false }` pulls it back to draft.

---

## 7. Worked recipes

**A. Stand up a docs hub from scratch**
```
1. hub.getState {}                                           # confirm handle (else POST /api/user/handle)
2. hub.folder.create { "name":"Getting Started" }            # → folderId G
3. hub.folder.create { "name":"Guides" }                     # → folderId Gu
4. hub.doc.create { "title":"Welcome", "content":"# Welcome\n...", "folderId":"<G>", "isPublished":true }
5. hub.doc.generate { "topic":"How to install the CLI", "audience":"new users", "folderId":"<Gu>" }
6. hub.doc.publish { "id":"<generated doc id>" }             # review draft, then publish
7. hub.getState {}                                           # verify tree + publicUrl
```

**B. Reorganize**
```
hub.listDocs {}                                              # find doc ids
hub.doc.move { "id":"<doc>", "folderId":"<target folder>" }  # or omit folderId → root
hub.folder.update { "id":"<folder>", "name":"Tutorials" }    # rename
hub.folder.update { "id":"<child>", "parentId":"<newParent>" } # move a folder
```

**C. Edit + republish a doc**
```
hub.getDoc { "slug":"welcome" }                              # read current content
hub.doc.update { "id":"<id>", "content":"# Welcome\n\nUpdated...", "tags":["intro"] }
hub.doc.publish { "id":"<id>" }
```

---

## 8. Guardrails & gotchas

- **Identity is the session** — never pass `userId`/`handle` in params; it's ignored/rejected. All reads/writes are owner-scoped.
- **Deleting a folder does NOT delete its docs** — they re-parent upward. Delete docs explicitly with `hub.doc.delete` if you want them gone.
- **Slugs are auto-unique** per user — creating two docs with the same title yields `title` and `title-<suffix>`.
- **Publish before it's public** — a freshly created/generated doc is a draft until published.
- **No handle → no public URL** — authoring still works; `publicUrl`/`url` come back `null` until a handle is claimed.
- **`hub.doc.generate` uses the LLM** (same transport as Offer/Storefront Studio) — it writes markdown and saves a **draft**; review with `hub.getDoc`, then `hub.doc.publish`.

---

## 9. Source map (SkillTown repo)

- Commands lib: `SkillTown/lib/creator-hub/commands/*` (`manifest.ts`, `dispatch.ts`, `registry.ts`, `serverContext.ts`, `context.ts`, `schema.ts`)
- Owner-scoped service: `SkillTown/lib/creator-hub/service.ts` (`HubService`, `buildHubService`)
- Route: `SkillTown/app/api/hub/commands/[name]/route.ts` (GET manifest · POST dispatch)
- Underlying data/read: `SkillTown/lib/services/knowledgeBaseService.ts`, `SkillTown/lib/services/treeService.ts`; public page `SkillTown/app/(hub)/hub/[handle]/[[...path]]/page.tsx`
- Legacy REST (still used by the web UI): `SkillTown/app/api/hub/learn/*`

---

## 9b. Desktop editor bridge (alternate transport)

The primary surface above is the **web command bus** (`/api/hub/commands/*`). The **desktop editor** manages the same hub content over its local bridge instead:

- Bridge routes: `/api/bridge/hub/:handle/*` → proxied to the web MCP endpoints `/api/mcp/learn/*`.
- Batch CRUD + publish: `POST /api/bridge/hub/:handle/manage` (actions `create_folder`, `rename_folder`, `delete_folder`, `create_article`, `update_article`, `delete_article`, `move_article`, `publish`, `unpublish`; supports `operations[]` batches with `$0`/`$1` id back-references).
- Edit a doc: `POST /api/bridge/hub/:handle/edit`. Read: `GET .../articles`, `.../articles/:id`, `.../search`, `.../categories`, `.../folders/:id`.
- Same ownership rule: server resolves `handle`→owner `userId`; callers only touch their own content (IDOR-safe).

Use this transport only from the ContentLead desktop app; from the web app or a signed-in agent, prefer `/api/hub/commands/*` above.

---

## 10. Related skills

| Skill | Owns |
|---|---|
| `cl-creator-biopage` | The link-in-bio / storefront page at `/<handle>` (typed sections, vibes, publish). |
| `cl-offers` | Sales / checkout / thank-you / email surfaces (`/api/offer-studio/commands/*`). |
| `cl-editor` | The desktop video editor (local bridge) — unrelated to the web hub. |
