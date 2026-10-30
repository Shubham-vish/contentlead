# LinkedIn — Owned Posts, Image Uploads & Publishing

Read Desktop discovery fresh; use `Authorization: Bearer $TOKEN`. This is the
signed-in user's native LinkedIn UI/service flow, not an arbitrary provider proxy.
Source support does not mean an older running Desktop/server has these routes.
No live provider actions are appropriate during a source-only audit.

## Approval and accounts

`GET /api/bridge/accounts` returns aggregate accounts under
`linkedin:{ok,accounts:[{id,name,...}]}`. Select an existing connected account.
OAuth connection/login and provider consent are human steps in the app, not
commands that an agent can approve on the user's behalf.

Before uploading, publishing, or deleting, preview the exact account and action
and obtain explicit user approval. For publishing include copy, visibility,
post type, images/link, and immediate timing. For upload include the exact local
file and explain that its bytes go to LinkedIn. For deletion identify the exact
saved post/permalink. Only then send `approved:true`; that field is an assertion
of consent, not a substitute for actually obtaining it.

## 1. List owned posts / inspect saved status

```bash
curl "http://127.0.0.1:$PORT/api/bridge/linkedin/posts?accountId=def456&status=all&limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

Returns `{posts,total,limit,offset,hasMore}` from the owner's saved LinkedInPosts.
`status` is `published` (default), `deleted`, or `all`; `limit` is an integer1–100
(default50), `offset`0–100000 (default0). Account filters are optional for reads;
caller-supplied owner IDs and unknown query fields are rejected.

```bash
curl "http://127.0.0.1:$PORT/api/bridge/linkedin/posts?accountId=def456&postUrn=urn%3Ali%3Ashare%3A123" \
  -H "Authorization: Bearer $TOKEN"
```

Single-post lookup returns `{post,source:"stored",providerVerified:false}` or404
for an absent/wrong-owner/wrong-account record. This is **saved status**, not
a provider refresh. Posts missing from local history after a persistence failure
cannot be recovered by pretending this read verified LinkedIn.

## 2. Acquire image URNs using the native upload

```bash
# Only after approval of this exact file/account:
curl -X POST "http://127.0.0.1:$PORT/api/bridge/linkedin/posts/upload-image" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId":"def456","filePath":"/absolute/path/approved.png","approved":true}'
```

The bridge reads one local regular PNG/JPEG/GIF, nonempty and at most8MiB.
It sends multipart `image` + `accountId` through the same authenticated
`/api/linkedin/posts/upload-image` as ComposePostDialog. The server independently
checks the account, type, and size; the Desktop helper bounds the actual read.
Remote URLs, base64 bodies, and arbitrary extra form fields are not supported here.

Success is `{success:true,imageUrn:"urn:li:image:..."}` only after the provider
upload completes. Keep the **returned** URN for that account; do not fabricate one.
Upload is not publication. There is currently no image-processing-status
polling route; provider processing may still reject an immediate image post.
A failed/uncertain upload must not trigger automatic repeated disclosure.

## 3. Publish tracked content

`POST /api/bridge/publish/linkedin` accepts only:

| Field | Contract |
|---|---|
| `approved` | Required literal `true`, after the preview above |
| `accountId` | Required connected account ID; native service resolves owner/token |
| `contentId` | Required owned Content ID for attempt tracking |
| `text` | Required nonempty string, at most3000 characters |
| `postType` | Required explicit `text`, `image`, or `article` |
| `visibility` | Required explicit `PUBLIC` or `CONNECTIONS` |
| `imageUrns` | At most9 `urn:li:image:...` values; at least1 for image posts |
| `articleUrl` | Required HTTPS URL for article posts, at most2048 characters |
| `articleTitle` | Optional, at most200 characters |
| `retryOf` | Optional failed/cancelled attempt ID belonging to this Content/account, for an explicitly reviewed retry |

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/publish/linkedin" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","accountId":"def456","text":"Approved copy","postType":"text","visibility":"PUBLIC","approved":true}'
```

For image posts use `postType:"image",imageUrns:[<returned URN>,...]`.
For article posts use `postType:"article",articleUrl:<approved HTTPS URL>`.
Do not silently drop a failed image to publish a text post.

Native success is `{success:true,post:{id,postUrn,postUrl,...},attemptId}`.
`attempt_persistence_error:true` means the provider and saved post succeeded but
the attempt status could not be updated; reconcile history, never publish again.
The native service verifies Content ownership, refuses an already
started/in-progress/succeeded attempt for that Content/account, and persists the
requested attempt **before** dispatching to LinkedIn. This is a replay guard,
not an atomic cross-request idempotency lock: do not submit concurrent publishes.
Never use an absent `contentId` to bypass a blocked tracked publish.

Posting does not fill copy from Content and does not automatically set
`channels.linkedin.status`. Only after confirmed success with the real post URN:

```bash
curl -X POST "http://127.0.0.1:$PORT/api/bridge/content/configure-publish" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"contentId":"content_xxx","platform":"linkedin","config":{"status":"published"}}'
```

Read back the owned Content and saved post. Content channel status, saved
LinkedInPosts state, and provider state are distinct. There is no LinkedIn
scheduler or in-flight provider cancellation command.

## 4. Delete a saved owned post

```bash
# Only after explicit destructive-action approval for this exact post/account:
curl -X DELETE "http://127.0.0.1:$PORT/api/bridge/linkedin/posts" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId":"def456","postUrn":"urn:li:share:123","approved":true}'
```

The native route requires an owner-scoped saved post matching this account.
It deletes at LinkedIn first, then soft-deletes locally. Provider404 means absent;
other provider failures do **not** silently mark the saved record deleted.
Success is `{success:true,status:"deleted",providerDeleted:true}`.
An already-deleted saved record returns `alreadyDeleted:true,providerVerified:false`
without replaying the provider request. A deleted local row is not a new provider
verification. Deleting a provider-only post missing from local history is not
supported by this wrapper.

## Errors, uncertainty, and cancellation

-400 `invalid_params`: fix the bounded schema; no provider dispatch.
-403 `approval_required`: obtain real consent; do not simply toggle the flag.
-401/403 native auth/permissions,404 owner/account/record mismatch: resolve in UI.
-409 `publish_attempt_blocked`: inspect attempt history; never auto-reset it.
-503 `attempt_persistence_failed`: requested tracking could not be saved; no post
  was dispatched. Repair persistence rather than bypassing `contentId`.
-502 `outcome_uncertain` / ambiguous transport / timeout: no automatic replay.
  Publication remains `in_progress` when its outcome is unknown. Inspect
  `GET /api/bridge/content/:id/publish/attempts` and the actual account.
-502 `post_persistence_failed` with `providerPublished:true,postId,postUrl`: the
  provider confirmed publication, but saved-post persistence failed. Do not post
  again. The attempt is marked succeeded when possible; reconcile the local view.
-502 `delete_persistence_failed` with `providerDeleted:true`: provider deletion
  completed but the local row did not update. Do not claim both stages completed.
  Reconcile deliberately; a reviewed repeat can treat provider404 as absent.

These mutations do not auto-retry. Strict JSON transport refuses HTML/non-JSON
“success.” Cancelled incoming requests detected before dispatch return499 without
provider work; disconnecting after dispatch cannot guarantee provider cancellation.
No endpoint here polls live provider post status or image-processing status.
Those are real remaining API gaps, not automated success.

## Creator pipeline handoff

- Research (`cl-content-inspiration`) supplies saved references and proposed copy,
  not permission to publish it. Resolve exact account/copy/visibility approval.
- Boards (`cl-board`) can export a reviewed image with `board.exportPng`; its
  response has `result.imageBase64` containing a PNG data URL. Save/decode those
  bytes into an approved local `.png`, then use upload-image above and the returned
  image URN. Never pass the data URL as a provider URN or `filePath`.
- Generated images can use the same local-file upload after media selection and
  approval. Uploading does not prove image processing or publication completed.
- Apps hosting, Hub docs and bio storefront return published HTTPS destinations;
  an approved public destination can be the article URL. Preview/private share
  URLs are not automatically safe to publish.
- Voice Lab returns audio/history references. Use the editor's approved media
  workflow to assemble a video for Instagram/YouTube; this LinkedIn native
  composer supports text/images/articles, not standalone audio or video uploads.
