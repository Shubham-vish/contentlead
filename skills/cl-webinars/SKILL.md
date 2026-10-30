---
name: cl-webinars
description: "Create, schedule, run and analyse a creator's ContentLead MEETINGS and WEBINARS from any AI agent through the desktop bridge webinar.* command bus. Owns the whole lifecycle: create/update/cancel/duplicate, start/end (warm-up polling), PRE-RECORDED (broadcast/simulive) webinars — upload a local video, reuse a past recording, attach it with auto-start/auto-play/auto-end, waiting-screen background image + music, real TEST RUNS, repeat series on host-picked dates or rolling just-in-time slots — plus registrations/approvals, invites, branded e-mails, polls, Q&A, chat moderation, CTAs, hands/reactions, cloud recording, replay settings, attendance + funnel analytics (CSV). NOT the video editor (cl-editor), NOT podcast/episode clipping (cl-production), NOT sales pages (cl-offers). Also: pre-recorded video timeline (CTA/poll/message at minute X), replay window, reminder cadence + follow-ups, landing questions/cover, engagement + series rollup analytics, outbound webhooks."
tags: contentlead, skilltown, webinar, meeting, sessions, simulive, pre-recorded, broadcast, evergreen, repeat-series, waiting-screen, test-run, registrations, emails, polls, qa, cta, analytics, command-bus, desktop-bridge, webinar.create, webinar.broadcast.set
---

# cl-webinars — Meetings & webinars (live + pre-recorded) via the desktop bridge

> **Owns the question:** *"How does an AI agent set up and run a creator's meeting or webinar end to end — including a pre-recorded webinar with a waiting screen, a real test run and repeat dates — and then read who came and what converted?"*
> **Delegates to / NOT:** cutting/editing the video itself → `cl-editor` / `cl-production`; generating a waiting-screen image → `cl-ai-media`; the offer a CTA points at → `cl-offers`; promoting the webinar → `cl-content-publishing`.

## 1. What it is

ContentLead "Sessions" are **MEETINGs** (small interactive calls) and **WEBINARs** (host stage + audience). A webinar can be **pre-recorded**: a READY library video is attached and, at `scheduledAt`, the event goes live by itself and plays the video in sync for every viewer (chat, Q&A, polls and CTAs still work live).

Every `webinar.*` command is a thin adapter that calls the **exact same** `/api/sessions/**` route handler the web UI uses — same auth, plan gates (`sessions.host`, `sessions.webinar`), quotas, rate limits and e-mails. There is no separate "agent" business logic: whatever the UI rejects, the agent is rejected for too.

Identity is **always** the signed-in user in the desktop app. Never pass a `userId`/`hostId`.

Event status: `DRAFT → SCHEDULED → WARMING → LIVE → ENDED` (or `CANCELLED`).

## 2. Connect through the desktop bridge

> Read fresh `~/.skilltown-desktop/api.json` and use the existing signed-in app.
> If unavailable, report it; do not start, restart, switch origins or reload the
> user's app merely to inspect source/skills. No mounted editor is needed.

```bash
API=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write("http://127.0.0.1:"+c.port)')
TOKEN=$(node -e 'const c=require(require("os").homedir()+"/.skilltown-desktop/api.json");process.stdout.write(c.token)')
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
```

| Bridge endpoint | Forwards to | Use |
|---|---|---|
| `GET  $API/api/bridge/webinars/commands` | `GET /api/sessions/commands/manifest` | Live manifest: every command, JSON-schema params, nullable fields, examples. **Read it first** — it beats this doc. |
| `POST $API/api/bridge/webinars/commands/<name>` body `{"params":{…}}` | `POST /api/sessions/commands/<name>` | Run one command. |
| `POST $API/api/bridge/webinars/upload-video` body `{"path":"/abs/file.mp4","title":"…"}` | create asset → block upload → finalize | Upload a **local video**, **image** (.jpg/.png/.webp ≤ 10 MB → landing `coverAssetId` / lobby image) or **audio** (.mp3/.m4a/.aac/.ogg/.wav ≤ 50 MB → lobby music) in one call (§4). Images need no duration; response has `kind`. |
| `GET $API/api/bridge/webinars/report.csv?eventId=<id>&report=attendance\|funnel` | exact native event report with `format=csv` | **Only when advertised by installed capabilities:** separate authenticated binary CSV download, not a JSON command. Complete artifact ≤50 MiB, native staff authorization, no URL/owner override, no partial-success file. Older builds return404; never infer installation from this doc. |

```bash
curl -s "${H[@]}" "$API/api/bridge/webinars/commands" | jq '.commands[] | {name,summary}'
curl -s "${H[@]}" -X POST "$API/api/bridge/webinars/commands/webinar.list" -d '{"params":{}}'
```

**Envelope:** `{ ok, command, result }`.

- **Success:** `result.data` is the route's JSON (HTTP 200).
- **Accepted / still working:** `result.pending:true` (route answered 202, e.g. `webinar.start` while WARMING) plus `result.retryAfter` (seconds) — wait, poll, retry.
- **Bad params:** `ok:false` with `error` + `validationErrors` (HTTP 400). Array limits are enforced up front: `slots` ≤ 30, `registrationIds` 1–200, `invites` 1–100, poll `options` 2–6.
- **Not signed in:** `"Authentication required"` (401).
- **Unknown command:** 404.
- **Route failure:** the HTTP status **is** the route's own status (403 plan gate, 404, 409 conflict, 429 rate limit, 503, …), also in `result.status`, with `result.error`, `result.code` and `result.retryAfter` when the route sent `Retry-After`.
- **CSV/ICS:** complete files up to **1 MiB UTF-8** return
  `{contentType,text,truncated:false,length}` inside `result.data`. Save `text`
  to an explicitly chosen private local file without overwriting; do not print
  participant data. Overflow cancels the read and returns HTTP413,
  `result.code:"report_too_large"`, **never a successful partial file**.
  Use the separately advertised `report.csv` binary route for larger exports
  (≤50 MiB), or native UI download when that Desktop integration is absent.
  Non-download JSON/text still uses the 200k-character preview cap; narrow
  queries with filters/`limit`/`cursor` when `truncated:true`.
- **Timeouts:** the bridge waits up to **120 s** per command. A **504** (`bridge_timeout`) does **not** mean it failed — the command may have run. Before retrying anything that creates or changes state (`create`, `duplicate`, `testRun.create`, `start`, `invites.create`, `emails.sendTest`, …) check `webinar.list` / `webinar.get` (or the matching `*.list`) to see if it already happened.
- **Recovery checkpoint:** for an explicitly authorized start that returns202,
  wait `retryAfter` seconds and read `webinar.readiness` plus `webinar.get`;
  retry start only within that existing authorization. After upload
  `finalize_failed`, inspect `webinar.video.list` and use the returned asset ID
  with `webinar.video.finalize`—never upload the committed bytes again. Reports
  beyond the bounded 1 MiB JSON command limit use the fixed binary route only
  when the installed release advertises it. If absent, larger-export automation
  is a release/integration gap, **not** a human-consent requirement. Binary
  downloads reject >50 MiB with413, invalid/non-CSV/incomplete responses with502,
  preserve native auth/role errors, and never retry or expose provider URLs.
  Save only a completed successful CSV to an explicitly chosen private file
  without overwriting; on interrupted transport discard any partial local file.

> Needs a desktop build that has the `webinars` bridge rows and a web deploy that includes `/api/sessions/commands`. A 404 on `/api/bridge/webinars/*` means the desktop app is too old.

## 3. Command reference (83)

`eventId` is required on every event-scoped command and omitted below. Always confirm params against the manifest.

| Area | Commands | Key params / notes |
|---|---|---|
| State | `webinar.list`, `webinar.get`, `webinar.readiness`, `webinar.notices`, `webinar.recap`, `webinar.ics` | `list` = my events with `myRole`, status, counts — start here for ids; many events → page with `{take: 20}` then `{take: 20, cursor: nextCursor}` |
| Event | `webinar.create`, `webinar.update`, `webinar.cancel`, `webinar.duplicate` | `title` (req), `type` MEETING\|WEBINAR, `scheduledAt` ISO (null = draft), `timezone` IANA, `capacityMax`, `requireApproval`, `recordingEnabled`, `allowGuests`, `settings` (`durationMinutes`, `qaEnabled`, `pollsEnabled`, `reminders`, `landing`, replay keys …; shallow-merged — `reminders` / `landing` objects replace the saved ones whole). `cancel` is irreversible and e-mails registrants. |
| Reminders & follow-ups | `webinar.update {settings:{reminders}}` | `beforeMinutes` ≤ 5 ints, each 5–20160 (absent = default 24h/1h/10m, `[]` = none); `followUps` ≤ 4 × `{id?, audience: attended\|no_show, afterHours 1–720, subject?, body?}`. Preserve saved `id` (`[a-z0-9]{1,12}`) when editing to avoid re-sending a completed follow-up. Editable after ENDED. |
| Landing page | `webinar.update {settings:{landing}}` | `{coverAssetId?, trailerAssetId?` (READY library image / video)`, questions? (≤8: {id a-z0-9_-, label, type: text\|select, options?, required?}), showRegistrantCount?}` (shown once ≥ 10). Answers + UTM/referrer land on each registration. |
| Go live | `webinar.start`, `webinar.end` | `start` → 200 live · **202 WARMING** → `result.pending:true` (poll `readiness` until `ready`, call `start` again) · 503/504 media unavailable/timeout. The LiveKit join token is stripped — agents never join the room (there is no `webinar.join`). ⚠️ `start` makes the room **LIVE even with nobody on stage**: for a live-presented event let the host press Start in the UI; only start pre-recorded webinars (or ones the host asked you to start while they are on stage). |
| Self | `webinar.register`, `webinar.unregister` | the signed-in user; `register` also takes `answers {questionId: "…"}` (required questions → else 400) and `attribution {utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer}` |
| Library | `webinar.video.list`, `.startUpload`, `.finalize`, `.delete`, `.fromRecording` | `video.list` → `{assets:[…], recordings:[{recordingId, eventId, eventTitle, durationMs, recordedAt}]}`; `startUpload {title, contentType, sizeBytes}` → `{asset, uploadUrl}`; `finalize {assetId, durationMs}`; `fromRecording {recordingId}` (from `video.list → recordings`) reuses a cloud recording |
| Pre-recorded | `webinar.broadcast.get`, `.set`, `.clear`, `.control` | `set {assetId, autoStart, autoPlay, autoEnd}`; `control {action: play\|pause\|seek\|restart, toMs}` while LIVE |
| Waiting screen | `webinar.lobby.get`, `webinar.lobby.set` | `{imageAssetId, musicAssetId}` (READY image/audio assets); `null` clears, omitted keeps. Needs a video attached. |
| Video timeline | `webinar.broadcast.timeline.get`, `.set` | `set {timeline:[{id, atMs, kind: cta\|poll\|message, ctaId \| pollId \| text, hideAfterMs?}]}` replaces the whole list (≤100, `[]` clears); fires by **video position**, once each |
| Test run | `webinar.testRun.create` | `startsInMinutes` ∈ 3, 5, 10, 30 → real auto-starting **"Test – <title>"** copy |
| Repeat series | `webinar.series.get`, `.set`, `.stop`, `.getPublic`, `.pick` | `set {mode:"MANUAL", slots:[ISO…]}` or `{mode:"JUST_IN_TIME", intervalMinutes: 5\|10\|15\|20\|30\|60, minLeadMinutes, horizonDays}`; `stop` keeps existing runs; `pick {seriesId, slotAt}` |
| Registrations | `webinar.registrations.list`, `.update`, `.bulk`, `webinar.attendees` | list filter `status` (ALL, REGISTERED, APPROVED, JOINED, DENIED, CANCELLED, WAITLISTED, REMOVED), `q`, `name`, `email`, `cursor`, `limit`1–200; `sort:registeredAt\|name\|email\|status`, `direction:asc\|desc` (defaults registeredAt/asc). Keep filters/sort fixed across `nextCursor` pages. Rows carry `answers`, `utm*`, `referrer`; `bulk {registrationIds (≤200), action: approve\|deny\|waitlist, reason, notify}` |
| Invites | `webinar.invites.list`, `.create`, `.revoke`, `.accept` | create `invites:[{email, role: COHOST\|PANELIST\|MODERATOR\|ATTENDEE}]`, `message`; revoke by `inviteId`. **Accept is not event-scoped:** `{token,acknowledged:true}` using the private user-approved email-link token (16–256 chars). Native signed-in email must match; no role/account/event override or room join. Never log the token. |
| Live room | `webinar.participants.moderate`, `webinar.hands.list/set/lowerAll`, `webinar.reactions.send` | moderate by LiveKit `identity` (from `attendees`): mute/remove(+ban)/promote/demote/unban |
| Engagement | `webinar.polls.list/create/update`, `webinar.qa.list/ask/update`, `webinar.chat.list/send/moderate` | poll `question, options, openNow`; poll op open/close/vote; Q&A approve/answering/answered/dismiss; chat pin/unpin/slowMode (`seconds` 0–600)/attendeeChat |
| CTA | `webinar.cta.get`, `.set`, `.clear`, `.update`, `.delete` | `offerName` (offers listed by `cta.get`) or `url` + `title`, `buttonText`; `draft:true` saves it hidden (→ `cta.id`) for the video timeline; `ctaId` shows a saved one again (`cta.get {offers:true}` → `saved[]`); `dismissible:false` = attendees get no ✕ (stays until hidden/timeline hides it). `update {ctaId, title?, body?, buttonText?, url?, offerName?, dismissible?}` edits a saved one in place (only sent fields change; a showing card updates live; ordinary edits don't reopen it for viewers who closed it, but switching to `dismissible:false` shows it to everyone again). `delete {ctaId}` removes a saved one for good (hidden if showing, dropped from the video timeline, clicks kept) — **confirm with the user first**. Polling `cta.get` during a live event? pass `lite:true` (skips click totals) |
| E-mails | `webinar.emails.get`, `.set`, `.preview`, `.sendTest` | `get` returns catalogue/defaults/all previews. `set` and read-only `preview` require **`settings`**, not kind/variant; preview renders all kinds/variants without saving. Only `sendTest` takes `kind`, `variant`, optional draft `settings` — variant must fit the kind: `reminder_*`/`starting` → `member`\|`guest`, `recap_*` → `replay`\|`no_replay`, others `default`. Use `{{event_title}}`-style placeholders from the catalogue. Test sends require explicit approval. |
| Recording & replay | `webinar.recording.get/start/stop`, `webinar.recordings.list`, `webinar.replay.get/set` | replay.set needs ≥ 1 of `replayPublic`, `replayOfferName`, `replayCtaId`, `replayCtaAtMinute`, `replayExpiresAfterHours` (1–8760, window after the end; "ends soon" e-mail ~24 h before), `replayRegistrantsOnly`; `null` clears one (also accepted for `settings.replay*` in `update`). |
| Analytics | `webinar.attendance`, `.attendance.page`, `webinar.funnel`, `webinar.analytics.engagement`, `webinar.series.rollup`, `.series.rollup.page` | `format:"csv"` returns bounded complete CSV; the two `.page` commands reuse the UI's native server-paged/sorted tables. Attendance: `{eventId,take?,skip?,sort?,direction?,name?,email?,role?}`. Series: `{seriesId,take?,skip?,sort?,direction?,title?,status?}`. `take`1–100(default50), `skip`≥0(default0); responses contain `rows,total,take,skip,totals`. |
| Webhooks | `webinar.webhooks.list`, `.create`, `.update`, `.delete`, `.test`, `.rotate`, `.deliveries` | per user (all their events), ≤ 10; `create {url (public https), events: ["*"] or registration.created\|attendee.joined\|attendee.left\|cta.clicked\|event.started\|event.ended, description?}`; `update {id, url?, events?, description?, active?}`; `test/rotate/delete {id}`. `deliveries {id,take?,skip?,sort?,direction?,status?,eventType?}` returns `{deliveries,total,take,skip}`; take1–200(default50), status PENDING\|SENT\|FAILED, eventType substring≤200, sort createdAt\|eventType\|status\|lastStatus\|attempts (default createdAt/desc). **The signing secret is returned only by `create` / `rotate` — hand it to the user once; every other command strips it** (`secretPreview` only). |

Intentionally **not** exposed: room join (LiveKit tokens), LiveKit webhook, VM queue, telemetry, guest join/register and public CTA-click counting. Authenticated self-registration and approved invite acceptance are supported; never simulate another attendee or consent.

### Show the user what you built (open the page in the app)

After creating or changing something, **open the matching page in the ContentLead app** so the user sees the real UI (paths only; external URLs are blocked):

```bash
curl -s "${H[@]}" -X POST "$API/api/navigate" -d '{"url":"/meetings/<eventId>/manage?tab=broadcast"}'
# new tab instead of replacing the current one:
curl -s "${H[@]}" -X POST "$API/api/tabs/new" -d '{"url":"/meetings/<eventId>/manage?tab=overview","activate":true}'
# check what the user sees (works on every page, not only the editor; needs app ≥1.0.44):
curl -s "${H[@]}" "$API/api/screenshot?save=1"                          # → {path:"~/.skilltown-desktop/screenshots/shot-….png"} — open it with the view tool
curl -s "${H[@]}" "$API/api/screenshot?fullPage=1&save=1&format=jpeg&maxWidth=1400"   # whole scrolling page
curl -s "${H[@]}" "$API/api/screenshot/targets"                         # tabs + windows; then ?tabId=<id> (background tabs work)
```

| After you… | Open |
|---|---|
| list / create webinars | `/meetings` |
| `webinar.create` / `update` (title, schedule, capacity), landing page (cover, trailer, questions), replay settings | `/meetings/<id>/manage?tab=overview` |
| registrations / approvals | `/meetings/<id>/manage?tab=registrations` |
| co-hosts / panelists invites | `/meetings/<id>/manage?tab=panelists` |
| reminder cadence / follow-ups | `/meetings/<id>/manage?tab=reminders` |
| e-mail templates / tests | `/meetings/<id>/manage?tab=emails` |
| recording | `/meetings/<id>/manage?tab=recordings` |
| attendance, drop-off, funnel, series rollup | `/meetings/<id>/manage?tab=attendance` |
| pre-recorded video, waiting screen, **video timeline offers/polls/messages**, test run, repeat series | `/meetings/<id>/manage?tab=broadcast` |
| live offers (`webinar.cta.*`: saved offers, Show now, edit, delete), polls, Q&A, chat during the event | `/meetings/<id>` (the room; the host's **Offer** button lists saved offers with Preview / Edit / Show now) |
| what attendees see before it starts | `/meetings/<id>/landing` |
| replay / recap | `/meetings/<id>/replay`, `/meetings/<id>/recap` |
| repeat-series picker | `/meetings/series/<seriesId>` |
| webhooks | `/meetings/settings/webhooks` |

Rules: tabs only appear when the feature applies (e.g. `broadcast` = WEBINAR + host/co-host; an unknown tab falls back to Overview). Pages load data once, so after further commands **navigate to the same URL again** (or `POST /api/reload`) to show the update. Never navigate to `/meetings/<id>?start=1` — that starts the event; only `webinar.start` after the user confirms. Don't yank the user away from the video editor mid-task: prefer `/api/tabs/new` when the current tab isn't a meetings page (`GET /api/navigation` shows it).

**Links to share:** landing / registration page `https://contentlead.in/meetings/<eventId>/landing`; repeat-series picker `https://contentlead.in/meetings/series/<seriesId>` (`seriesId` from `webinar.series.get`).

## 4. Uploads

**Local video (recommended):**

```bash
curl -s "${H[@]}" -X POST "$API/api/bridge/webinars/upload-video" \
  -d '{"path":"/Users/me/Videos/masterclass.mp4","title":"Masterclass v3"}' --max-time 7200
# → { ok:true, asset:{id,status:"READY",durationMs,…}, durationMs, sizeBytes, blocks }
```

- **Formats:** `.mp4 .m4v .mov .webm`. Limits checked **before** anything is created: ≤ 8 GB, 1 s – 12 h.
- **What the bridge does:** probes duration with ffprobe (WebM without a container duration falls back to the stream duration, then a full ffmpeg decode), streams 8 MiB blocks straight to storage (4 parallel, up to 8 attempts each with backoff ≤ 30 s), commits the block list and finalizes (finalize retried 3×).
- **Timing:** it blocks until done, so use a long client timeout and **don't close the request** — disconnecting before the commit aborts the upload and deletes the asset. Progress is pushed on the bridge SSE stream (`GET $API/api/events`) as `webinar.upload.progress {assetId, fraction, done, count}`.
- **Don't double-start:** a second call for the same file (path + size + mtime) while one runs → **409 `upload_in_progress`** (with `assetId`). Wait, then check `webinar.video.list`.
- **Errors:**
  - `path_not_found`, `unsupported_type` or `empty` (400); `file_too_large` (413); `duration_out_of_range` / `probe_failed` (422);
  - `ffprobe_missing` (500) — the app's ffprobe is missing; reinstall the app or install ffmpeg;
  - `upload_url_expired` (502) — the storage SAS URL expired mid-upload (403 AuthenticationFailed); the asset was deleted, just run the upload again;
  - `storage_upload_failed` (502) — asset deleted, safe to retry;
  - **`finalize_failed` (502, `{ok:false, assetId, durationMs, retry:"webinar.video.finalize"}`)** — the bytes are already committed and the asset is kept (`UPLOADING`). **Do not re-upload**: call `webinar.video.finalize {assetId, durationMs}`;
  - `session_expired` (401);
  - plus plan, quota and rate-limit errors from the server.
- **Orphans:** if the app crashed mid-upload an `UPLOADING` asset can remain — find it in `webinar.video.list` and finalize it (if the upload had finished) or `webinar.video.delete` it (with the user's OK).

**Waiting-screen image / music / landing cover:** use the same `upload-video` bridge call with the image or audio path (it detects the kind, probes audio duration and finalizes) → `asset.id`, then `webinar.lobby.set` or `settings.landing.coverAssetId`. Only fall back to the manual SAS flow below when the bridge is unavailable.

**Manual SAS flow (fallback):**

- Images: `image/jpeg|png|webp`.
- Music: `audio/mpeg|mp4|x-m4a|aac|ogg|wav`.

1. `webinar.video.startUpload {title, contentType:"image/jpeg", sizeBytes}` → `{asset, uploadUrl}`.
2. `curl -X PUT "$uploadUrl" -H "x-ms-blob-type: BlockBlob" -H "Content-Type: image/jpeg" --data-binary @bg.jpg`
   - This covers files under 256 MB.
   - For larger files, use the `&comp=block` / `&comp=blocklist` steps in the `startUpload` manifest description. The `blockid` value is base64 and **must** be `encodeURIComponent`-encoded (`+ / =`), and all ids must have the same length.
   - A **403 `AuthenticationFailed`** from storage means the SAS URL expired: delete the asset and start over with a fresh `startUpload`.
3. `webinar.video.finalize {assetId}`.
   - Audio also needs `durationMs`.
   - Get it from `ffprobe -v error -show_entries format=duration -of csv=p=0 f.mp3`, then multiply by 1000.

Send bytes **only** to the SAS `uploadUrl`, never through SkillTown. Uploads are plan-gated, rate-limited and storage-capped.

## 5. Recipes

### A. Live webinar

1. `webinar.create {title, type:"WEBINAR", scheduledAt, timezone, settings:{durationMinutes:60}}` → `evt`.
2. Optional: `webinar.emails.preview` / `webinar.emails.sendTest`, `webinar.cta.set`, `webinar.polls.create {openNow:false}`.
3. At showtime the **host** starts it from the UI (an agent-side `webinar.start` puts the room live with nobody on stage — only do it if the host asks while they are present).
4. If `start` returns `result.pending:true` (202), wait `result.retryAfter` **seconds**, poll `webinar.readiness` until ready, then call `start` again only within the already authorized live-start workflow.
5. `webinar.end`.

### B. Pre-recorded webinar end to end

1. `webinar.create {title:"Growth Masterclass", type:"WEBINAR", scheduledAt:"2026-11-05T19:00:00+05:30", timezone:"Asia/Kolkata"}` → `evt`.
2. Get the video, either way:
   - `upload-video {path}` → `asset.id`;
   - or reuse a recording: `webinar.video.list` → `recordings[]` (`recordingId`, `eventTitle`, `durationMs`, `recordedAt`), then `webinar.video.fromRecording {recordingId}`.
3. `webinar.broadcast.set {eventId: evt, assetId, autoStart:true, autoPlay:true, autoEnd:true}`.
4. Waiting screen: `upload-video {path:"/abs/bg.jpg"}` and `upload-video {path:"/abs/music.mp3"}` (§4), then `webinar.lobby.set {eventId: evt, imageAssetId, musicAssetId}`.
5. **Test it for real (§6):** `webinar.testRun.create {eventId: evt, startsInMinutes:5}`.
6. Repeat dates: `webinar.series.set {eventId: evt, mode:"MANUAL", slots:["2026-11-12T19:00:00+05:30","2026-11-19T19:00:00+05:30"]}`, then `webinar.series.get` to confirm the occurrences.
7. Verify: `webinar.get` + `webinar.broadcast.get` show the asset as READY and `autoStart` on.

### C. Rolling "starts every 30 min" evergreen

- `webinar.series.set {eventId, mode:"JUST_IN_TIME", intervalMinutes:30, minLeadMinutes:10, horizonDays:7}`.
- Runs with no sign-ups never start the media server.
- `series.stop` stops offering new times.

### D. Approvals & invites

1. With `requireApproval`, call `webinar.registrations.list {status:"REGISTERED"}`.
2. Approve with `webinar.registrations.bulk {registrationIds, action:"approve", notify:true}`, but only after the user OKs e-mails.
3. Add co-hosts with `webinar.invites.create {invites:[{email, role:"COHOST"}]}`.
4. If the signed-in user received an invitation, obtain their explicit approval
   of that exact invitation, then `webinar.invites.accept {token,acknowledged:true}`.
   The token comes only from their private email link; never print it or accept
   on someone else's behalf. Expired/revoked/wrong-email/full/banned/event-ended
   denials remain native errors. Inspect `webinar.list` / `webinar.get` after
   uncertainty; do not blindly replay acceptance. Joining/microphone stays human.

### E. After the event

`webinar.recap` · `webinar.attendance {format:"csv"}` · `webinar.funnel` · `webinar.analytics.engagement` · `webinar.replay.set {replayPublic:true, replayOfferName}`.

- Registration export is assembled from `webinar.registrations.list` pages,
  not an invented `registrations.export` command: keep status/q/name/email/
  sort/direction fixed, carry `nextCursor` until null, and include rows' answers
  and attribution fields. Serialize with a proper CSV writer to an explicitly
  chosen private file; escape spreadsheet-formula prefixes and never print PII.
  Stop on a repeated cursor or unexpected truncated/error result instead of
  claiming a complete report. The live registration set is not snapshot-locked.
- Replay window, registrants only: `webinar.replay.set {eventId, replayExpiresAfterHours:72, replayRegistrantsOnly:true}` (`null` = forever / anyone).
- Series performance: `webinar.series.get` → `series.id`, then `webinar.series.rollup {seriesId}`.
- Large attendance/series tables: use `webinar.attendance.page` or
  `webinar.series.rollup.page` and preserve filters/sort/direction. Starting at
  `skip:0`, advance by the number of returned rows until `skip >= total`; if a
  page is unexpectedly empty, stop and refresh rather than loop. Totals cover
  the entire filter, not the current page. For stable historical reporting,
  prefer ended events; offset pages are not a snapshot lock while data changes.
- Attendance sorts: `name,email,role,firstJoinedAt,totalMs,sessions` (default
  `firstJoinedAt`, ascending). Series sorts:
  `title,scheduledAt,status,registrants,attendees,attendanceRate,ctaClicks`
  (default `scheduledAt`, descending). String filters are substring matches,
  at most200 characters. Role/status use the native manifest enums. Native
  operator/attendance-feature guards still apply; filters never select an actor.

### F. Pre-recorded automation: offer at video minute 45

1. Hidden CTA: `webinar.cta.set {eventId, offerName:"growth-course", buttonText:"Enroll now", draft:true}` → `result.data.cta.id`.
2. Poll: `webinar.polls.create {eventId, question, options, openNow:false}` → poll id (`webinar.polls.list`).
3. `webinar.broadcast.timeline.set {eventId, timeline:[{id:"hi", atMs:60000, kind:"message", text:"Drop your city 👋"}, {id:"poll", atMs:1200000, kind:"poll", pollId, hideAfterMs:120000}, {id:"offer", atMs:2700000, kind:"cta", ctaId}]}` (minute × 60000; must be within the video). Verify with `.get`.
4. Seeking back doesn't refire; `broadcast.control {action:"restart"}` refires all.

### F2. Live offers during the event (saved list, show / edit / delete)

1. Before or during: `webinar.cta.get {eventId, offers:true}` → `offers[]` (Offer Studio) and `saved[]` (this webinar's saved offers, newest first).
2. Prepare without showing: `webinar.cta.set {eventId, offerName, buttonText, draft:true, dismissible:false}` (no ✕ for attendees).
3. Show now: `webinar.cta.set {eventId, ctaId}` (a saved one) or with fresh fields. Hide: `webinar.cta.clear {eventId}`.
4. Fix a typo / price live: `webinar.cta.update {eventId, ctaId, title?, body?, buttonText?, url?, offerName?, dismissible?}` — the visible card updates for everyone.
5. Remove for good: `webinar.cta.delete {eventId, ctaId}` after the user confirms.
6. Show it: open `/meetings/<id>` — the host's **Offer** button lists saved offers with Preview / Edit / Show now / Delete.

### G. Reminder cadence, follow-ups, landing questions

```json
{"command":"webinar.update","params":{"eventId":"evt_123","settings":{
  "reminders":{"beforeMinutes":[10080,1440,60,15],
    "followUps":[{"audience":"no_show","afterHours":2,"subject":"You missed it — replay inside"},{"audience":"attended","afterHours":24}]},
  "landing":{"coverAssetId":"ast_cover","showRegistrantCount":true,
    "questions":[{"id":"role","label":"What best describes you?","type":"select","options":["Creator","Coach"],"required":true}]}}}}
```

Send the **whole** `reminders` / `landing` object (it replaces the saved one); read the current value from `webinar.get` first.

### H. Zapier / CRM webhooks

1. `webinar.webhooks.create {url:"https://hooks.zapier.com/…", events:["registration.created","cta.clicked"]}` → give the user `secret` now (HMAC-SHA256 in `X-ContentLead-Signature`).
2. `webinar.webhooks.test {id}` → `result {ok, status, durationMs}`; `webinar.webhooks.deliveries {id}` for the log.
3. Pause with `update {id, active:false}`; lost secret → `rotate {id}` (old one stops at once).
4. Diagnose older failures with `webinar.webhooks.deliveries
   {id,status:"FAILED",take:100,skip:0,sort:"createdAt",direction:"desc"}`.
   Advance `skip` by `deliveries.length` until `skip >= total`; keep filters and
   sort fixed, stop on an unexpected empty page. Offset pages are not snapshots.
   Reading logs never redelivers; `webhooks.test` is a new approved external send,
   not a recovery command for an uncertain previous delivery.

## 6. Testing a setup: use the real flow, not a fake one

There is no separate "test mode".

The following is a **real, consequential integration test**, not a source-audit
recipe. Obtain approval for the event, possible email/provider activity and
quota use first. For command/schema changes, prefer isolated mocked tests;
never create a live test run merely to claim audit coverage.

1. To test, create a **real** event with **"Test"** in its title (prefix or suffix). `webinar.testRun.create` does exactly that ("Test – <title>"):
   - it auto-starts in 3, 5, 10 or 30 minutes;
   - it uses the same video, waiting screen, co-hosts and polls.
2. Share its landing link (`https://contentlead.in/meetings/<testEventId>/landing`) with any test viewer: another account, or a guest if `allowGuests` is on.
3. Watch it go live and check sync, the sound prompt, chat and the CTA.
4. Cancel it, or leave it to end on its own.

Test runs **do** count toward plan quotas.

## 7. Guardrails

- Read the manifest before calling unfamiliar commands. Never invent commands or params.
- Get the user's explicit OK before:
  - cancelling an event or deleting a video;
  - deleting a webhook or rotating its secret (breaks the receiving integration);
  - anything that e-mails people: `notify:true`, `emails.sendTest` to real addresses, `invites.create`.
- Respect these errors:
  - 403 = plan;
  - 409 = conflict (e.g. capacity below seats taken, or a clashing/duplicate slot);
  - 429 = back off, don't loop.
- A series can have up to 30 upcoming runs.
- Be honest: no fake attendees, fake counts or invented urgency.
- Times are ISO 8601 with an offset, and always pass an IANA `timezone`.

## 8. Source map

| Piece | Where |
|---|---|
| Command manifest / schemas / route bindings / dispatch | `SkillTown/lib/sessions/commands/{manifest,schema,route-adapter,dispatch}.ts` |
| Web command route | `SkillTown/app/api/sessions/commands/[name]/route.ts` |
| Underlying handlers | `SkillTown/app/api/sessions/**/route.ts` |
| Broadcast / series / lobby / timeline logic | `SkillTown/lib/sessions/broadcast-*.ts` (`broadcast-timeline.ts`), `SkillTown/docs/sessions/ARCHITECTURE.md` |
| Reminders / landing / replay settings, analytics, webhooks | `SkillTown/lib/sessions/{reminder-settings,landing-settings,replay-settings,attendance-analytics,outbound-webhooks}.ts` |
| Desktop passthrough + upload + bounded CSV | `SkillTown-Desktop/electron/api-server/bridge-routes.cjs` (`handleBridgeWebinarUploadVideo`), `webinar-upload.cjs`, `webinar-report-download.cjs` (requires central dispatch registration), `api-endpoints.cjs` |

## 9. Related skills

`cl-editor` (cut the video first) · `cl-ai-media` (generate a waiting-screen image) · `cl-offers` (offer behind the CTA / replay) · `cl-content-publishing` (promote it) · `cl-voice` (voice-over).
