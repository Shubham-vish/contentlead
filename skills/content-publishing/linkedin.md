# LinkedIn — Posting & Management

> **⚠️ LinkedIn publishing is NOT content-aware.**
> The `linkedin_post` tool does NOT read from or write to Content documents.
> Posts go live but are NOT tracked in the ContentLead dashboard's publish status.
> See the workaround below to maintain content tracking.

---

## Tools

### `linkedin_get_account` — Get connected account

No parameters.

```json
{
  "success": true,
  "total": 1,
  "active": 1,
  "accounts": [
    {
      "id": "def456",
      "name": "John Doe",
      "headline": "Content Creator",
      "profilePic": "https://..."
    }
  ]
}
```

---

### `linkedin_post` — Create a post

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Post content (up to 3000 chars) |
| `image_urls` | string | | — | JSON array of image URLs (1–9): `'["https://..."]'` |
| `article_url` | string | | — | URL to share as a link card |
| `article_title` | string | | — | Custom title for the article card |
| `article_description` | string | | — | Custom description for the article card |
| `visibility` | string | | `"PUBLIC"` | `"PUBLIC"` or `"CONNECTIONS"` |

Post type is inferred: text only, text + images, or text + article link.

**LinkedIn is synchronous** — response confirms success immediately.

---

### `linkedin_get_posts` — Get published posts

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `count` | int | | `20` | Number of posts (newest first) |

---

### `linkedin_delete_post` — Delete a post

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `post_urn` | string | ✅ | — | Post URN from `linkedin_get_posts` (e.g. `"urn:li:share:12345"`) |
| `delete_from_linkedin` | bool | | `true` | Also delete from LinkedIn. `false` = local DB only. |

---

## Content-Aware Workaround

Since LinkedIn tools don't read Content documents, follow this pattern to maintain tracking:

```python
# 1. Read content to get the caption/description
content = content_get(content_id="content_xxx")
caption = content.get("caption") or content.get("description", "")

# 2. Post to LinkedIn
linkedin_post(
    text=f"{caption}\n\n#AI #ContentCreation",
    visibility="PUBLIC"
)

# 3. Manually update content status to reflect the publish
content_configure_publish(
    content_id="content_xxx",
    platform="linkedin",
    status="published"
)
```

This way the ContentLead dashboard shows LinkedIn as published, even though the tool itself doesn't track it.

---

## Desktop Bridge (Alternative)

> **⚠️ Bridge is also NOT content-aware for LinkedIn.**

```bash
curl -X POST http://127.0.0.1:$PORT/api/bridge/publish/linkedin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId": "def456", "text": "New video! 🎬\n\n#content"}'
# → { "success": true, "post": { "id": "urn:li:share:xxx", ... } }
```

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| `not_authenticated` | Bridge: user not logged in | Log in via Electron app |
| `missing_params` | No text provided | Provide `text` param |
| Character limit exceeded | Text > 3000 chars | Shorten post text |

## Tips

- **LinkedIn is synchronous and fast** — no polling needed
- **Always do the content-aware workaround** — read content → post → update status
- **Use `article_url` for link previews** — LinkedIn auto-generates rich cards
- **Keep posts professional** — LinkedIn audience expects different tone than IG/YT
