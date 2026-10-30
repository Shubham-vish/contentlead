# Separate legacy course authoring

The `/teacher/courses` creator UI is a different product surface from Hub
markdown docs, not an alias for `hub.*` or Offer Studio. Use it only when the
user explicitly wants a course with chapters, resources and legacy course offers.
The Desktop must advertise these routes in `GET /api/capabilities`.

All paths below start `/api/bridge/creator-courses`. Normal Desktop bearer
authentication attaches the signed-in web session. Native course ownership is
checked server-side; never send an owner/user ID. Every mutation requires
`approved:true` after reviewing the exact operation, including changes to an
already-public chapter/course or public CTA copy.

| Method / suffix | Body / behavior |
|---|---|
| `GET /?limit=50&offset=0` | Owned courses; limit 1–100, offset 0–100000 |
| `GET /categories` | Native course categories (`id`,`name`) |
| `POST /` | `{title,approved:true}` → draft course |
| `GET /<courseId>` | Owned course, ordered chapters, attachments, legacy `offerCourses` |
| `PATCH /<courseId>` | `{title?,description?,imageUrl?,categoryId?,price?,approved:true}` |
| `DELETE /<courseId>` | `{approved:true}`; native course deletion |
| `PATCH /<courseId>/publish` or `/unpublish` | `{approved:true}`; native requirements remain authoritative |
| `POST /<courseId>/chapters` | `{title,approved:true}` → next-position chapter |
| `PATCH /<courseId>/chapters/<chapterId>` | `{title?,description?,shortDescription?,videoUrl?,duration?,isFree?,approved:true}` |
| `DELETE /<courseId>/chapters/<chapterId>` | `{approved:true}` |
| `PATCH /<courseId>/chapters/<chapterId>/publish` or `/unpublish` | `{approved:true}` |
| `PUT /<courseId>/chapters/reorder` | `{list:[{id,position}],approved:true}`; 1–500 unique chapters/positions; native validates course membership before transactional writes |
| `POST /<courseId>/upload-asset` | `{filePath,chapterId?,approved:true}`; Desktop-only selected regular-file limit ≤25 MiB, supported home media/document directories, no symlink; native `/api/uploadasset` |
| `POST /<courseId>/attachments` | `{url,chapterId?:string|null,approved:true}`; register a previously uploaded HTTPS resource |
| `DELETE /<courseId>/attachments/<attachmentId>` | `{approved:true}`; delete resource association, **not cloud bytes** |
| `POST /<courseId>/offers` | `{offerName,approved:true}`; native legacy course offer, not Offer Studio |
| `PATCH /<courseId>/offers/<offerId>` | `{status?:"ACTIVE"|"DISABLED"|"DEFAULT",ctaText?,approved:true}`; default replacement is transactional |
| `DELETE /<courseId>/offers/<offerId>` | `{approved:true}` |

Use the suffix with **no trailing slash** for list/create. Responses:
`{result:<native JSON>,source:"stored",providerVerified:false}`. A course GET
has `result.course`, listing has `result.courses`, creation returns `result.id`.
No automatic publication or provider-verified outcomes are implied.

Field bounds: title/offerName ≤255 chars; descriptions ≤100000;
CTA text ≤1000 (empty clears it); HTTPS URLs ≤4096, no credentials;
price finite 0–100000000; chapter `duration` is integer **minutes**, 0–1000000,
not milliseconds. IDs are 1–200 letters/digits/underscore/dash.
No `isPublished`, owner override, arbitrary Prisma field or unknown query key
is accepted. Category/chapter/offer IDs must come from the owned GET response.

## Draft → publish → maintain

1. List courses/categories; create or read the intended course.
2. Set reviewed title/description/category/image/price.
3. Create chapters; set their description, HTTPS video URL, short description,
   duration and optional free-preview flag. Reuse an existing exported/uploaded
   video URL; this Desktop upload-asset bridge is capped at 25 MiB and is not
   a large-video pipeline. The existing web attachment uploader has no new
   app-level file cap.
   For an original local video, use the normal `cl-editor` Content render/upload
   flow (`POST /api/render` with the exact `contentId` and `uploadToCloud:true`)
   after approval, then reuse the resulting hosted URL. The existing
   `/api/bridge/content/upload-url` also requires a Content record; it is not an
   unrestricted course-upload proxy. For your own cover image, approved
   `storefront.media.upload` can provide an HTTPS URL for `imageUrl`.
   Check URL access/expiry against intended chapter playback; a stored SAS
   URL is not permanent access, and `/api/assets` registration does not upload bytes.
4. Optionally upload a selected course resource. Read `result.url`, then
   explicitly register it with `/attachments`; upload does **not** create that
   association. A chapter resource must belong to this same owned course.
5. Review and publish chapters first. Native chapter publishing requires
   title + description; native course publishing requires title + description +
   category + a published chapter. The UI also checks image/price before
   enabling publish—complete them for parity.
6. Publish the exact course after approval; GET to verify saved flags.
7. Reorder/edit/unpublish resources deliberately. Removing the last published
   chapter also unpublishes the course. Native bodyless chapter unpublish works.
8. Legacy course offer names/status/public CTA are managed separately from
   `cl-offers` sales pages and checkout. This bridge does not charge a customer.

The Desktop limits selected local bytes before native dispatch. The shared web
route retains its existing `request.formData()` upload capability, authenticates
before body parsing, and checks course/chapter ownership before Azure work.
Filenames are collision-resistant. Native `url` is the canonical blob URL returned
by the existing repository, not a time-limited SAS persisted into `Attachment.url`.
No live container ACL was inspected: this preserves the existing URL contract
but does not prove anonymous readability or independent purchaser access control.
Do not post resource links publicly unless approved; viewer/payment gating and
the storage access policy still matter. No automatic attachment creation occurs.
If the upload itself throws after dispatch, native reports
`upload_outcome_uncertain,blobAccepted:null,retryable:false`: `null` means
acceptance was not established, not that no bytes were stored.

Failure status/JSON must be inspected. Timeout, invalid-JSON response or 5xx
after mutation dispatch is `outcome_uncertain,retryable:false`. Re-read the owned
course before a deliberate retry; never automatically repeat creation,
publication, upload, deletion or a paid checkout. Native teacher analytics
currently shows mock numbers; it is not student/revenue analytics.
