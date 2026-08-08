---
name: hub
description: Creator Hub — manage articles, folders, and content in a user's personal knowledge hub
tags: hub, articles, knowledge, learn, create, publish, edit, folders
---

# Creator Hub

Manage a creator's personal knowledge hub — articles, folders, publishing, and content editing.

> **Important:** Always use `/api/bridge/hub/:handle/*` routes. Never use `/api/bridge/learn/*` — those are internal.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bridge/hub/:handle/articles` | List all articles (tree or flat) |
| GET | `/api/bridge/hub/:handle/articles/:id` | Get single article (by ID or slug) |
| GET | `/api/bridge/hub/:handle/search?q=...` | Search articles |
| GET | `/api/bridge/hub/:handle/categories` | List categories |
| GET | `/api/bridge/hub/:handle/folders/:id` | Get folder contents |
| POST | `/api/bridge/hub/:handle/manage` | Create/update/delete/publish articles & folders |
| POST | `/api/bridge/hub/:handle/edit` | Edit article content in-place |

## List Articles

```bash
curl "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/articles?view=tree" \
  -H "Authorization: Bearer $TOKEN"
```

Query params:
- `view=tree` (default) — folder tree with nested articles
- `view=flat` — flat list sorted by views
- `category=slug` — filter by category
- `tag=name` — filter by tag
- `fields=full` — include content body in response

## Get Article

```bash
curl "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/articles/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Accepts ID (UUID) or slug. Returns full content, metadata, reading time, etc.

Add `?as=markdown` to convert HTML articles to markdown.

## Search Articles

```bash
curl "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/search?q=react&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Returns matching articles with preview snippets.

## Create Article

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/manage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_article",
    "title": "Getting Started with React",
    "content": "# React Basics\n\nReact is a JavaScript library...",
    "description": "A beginner guide to React",
    "tags": ["react", "javascript", "tutorial"],
    "folderId": "optional-folder-id"
  }'
```

Articles start as **drafts** — use `publish` action to make them public.

## Update Article

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/manage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_article",
    "articleId": "article-uuid",
    "title": "Updated Title",
    "description": "New description",
    "tags": ["updated", "tags"]
  }'
```

## Edit Content In-Place

For surgical edits without replacing the entire article:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/edit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "article-uuid",
    "find": "old text to replace",
    "text": "new replacement text"
  }'
```

Edit modes (determined by which fields are present):
| Fields | Operation |
|--------|-----------|
| `find` + `text` | Replace first unique occurrence of `find` with `text` |
| `find` + `text` + `replace_all: true` | Replace ALL occurrences |
| `at_line` + `text` | Insert `text` before line number (0-indexed) |
| `after_heading` + `text` | Insert `text` after a markdown heading |
| `text` (alone) | Append `text` to end of article |

## Publish / Unpublish

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/manage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "publish", "articleId": "article-uuid"}'
```

## Delete Article

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/manage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "delete_article", "articleId": "article-uuid"}'
```

## Folder Operations

### Create Folder
```json
{"action": "create_folder", "name": "My Folder", "parentId": "optional-parent-id"}
```

### Rename Folder
```json
{"action": "rename_folder", "folderId": "folder-uuid", "name": "New Name"}
```

### Delete Folder
```json
{"action": "delete_folder", "folderId": "folder-uuid"}
```

### Move Article to Folder
```json
{"action": "move_article", "articleId": "article-uuid", "folderId": "target-folder-uuid"}
```

## Batch Operations

Chain multiple operations in one request. Use `$0`, `$1` references for IDs from earlier ops:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/$HANDLE/manage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"action": "create_folder", "name": "React Tutorials"},
      {"action": "create_article", "title": "React Hooks", "folderId": "$0", "content": "# Hooks\n..."},
      {"action": "create_article", "title": "React Context", "folderId": "$0", "content": "# Context\n..."},
      {"action": "publish", "articleId": "$1"},
      {"action": "publish", "articleId": "$2"}
    ]
  }'
```

Max 50 operations per batch.

## Response URLs

All responses return hub URLs in the format:
```
https://contentlead.in/hub/:handle/:article-slug
```

Example response:
```json
{
  "success": true,
  "results": [{
    "id": "abc-123",
    "type": "article",
    "title": "React Hooks",
    "slug": "react-hooks",
    "url": "https://contentlead.in/hub/ailead/react-hooks"
  }]
}
```

## Typical Workflow

```bash
# 1. List existing articles
curl "http://127.0.0.1:$PORT/api/bridge/hub/ailead/articles?view=tree" -H "Authorization: Bearer $TOKEN"

# 2. Create a new article
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/ailead/manage" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action": "create_article", "title": "My New Post", "content": "# Hello\n\nThis is my post."}'

# 3. Edit the content
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/ailead/edit" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id": "<article-id>", "after_heading": "Hello", "text": "\nAdded this paragraph after the heading."}'

# 4. Publish it
curl -X POST "http://127.0.0.1:$PORT/api/bridge/hub/ailead/manage" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action": "publish", "articleId": "<article-id>"}'
```
