# LinkedIn — Posting & Management

Use the SkillTown Desktop local HTTP API. Read `~/.skilltown-desktop/api.json` fresh before each call and use `Authorization: Bearer $TOKEN`.

> **⚠️ LinkedIn publishing is NOT content-aware.**
> `POST /api/bridge/publish/linkedin` does not read from or write to Content documents.
> Posts go live but are not tracked in the ContentLead dashboard's publish status unless you do the manual tracking update below.

---

## Accounts

### `GET /api/bridge/accounts` — Get connected accounts

Returns aggregate connected accounts, including LinkedIn accounts.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/accounts"   -H "Authorization: Bearer $TOKEN"
```

Example LinkedIn account shape:

```json
{
  "success": true,
  "accounts": [
    {
      "id": "def456",
      "name": "John Doe",
      "headline": "Content Creator",
      "profilePic": "https://...",
      "platform": "linkedin"
    }
  ]
}
```

---

## Posting

### `POST /api/bridge/publish/linkedin` — Create a post

| Body field | Required | Description |
|------------|----------|-------------|
| `accountId` | ✅ | LinkedIn account ID from `GET /api/bridge/accounts` |
| `text` | ✅ | Post content |
| `postType` | | Post type, if needed by the route |
| `imageUrns` | | LinkedIn image URNs |

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/publish/linkedin"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"accountId":"def456","text":"New video! 🎬

#content","postType":"post","imageUrns":[]}'
```

LinkedIn posting is synchronous: the response confirms success immediately.

> TODO(no-bridge-equivalent): The previous docs covered article link-card fields, visibility selection, listing published LinkedIn posts, and deleting LinkedIn posts. The verified local endpoint mapping only includes account discovery and post creation.

---

## Content-Aware Workaround

Since LinkedIn posting does not read Content documents, follow this pattern to maintain dashboard tracking:

```bash
# 1. Read content to get caption/description
curl "http://127.0.0.1:$PORT/api/bridge/content/content_xxx"   -H "Authorization: Bearer $TOKEN"

# 2. Post to LinkedIn
curl -X POST "http://127.0.0.1:$PORT/api/bridge/publish/linkedin"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"accountId":"def456","text":"Just published a deep dive into AI tools!

#AI #ContentCreation"}'

# 3. Mark LinkedIn status on the Content doc
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish"   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"contentId":"content_xxx","platform":"linkedin","config":{"status":"published"}}'
```

This way the ContentLead dashboard shows LinkedIn as published even though the post endpoint itself does not track Content state.

---

## Error Handling

| Error | When | Fix |
|-------|------|-----|
| `not_authenticated` | User not logged in | Log in via SkillTown Desktop |
| `missing_params` | No text or account provided | Provide `accountId` and `text` |
| Character limit exceeded | Text too long | Shorten post text |

## Tips

- LinkedIn is synchronous and fast; no polling needed.
- Always do the content-aware workaround: read content → post → update channel status.
- Keep posts professional; LinkedIn audience expects a different tone than IG/YT.
