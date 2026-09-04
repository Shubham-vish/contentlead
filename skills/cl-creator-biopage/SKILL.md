---
name: cl-creator-biopage
description: Build, edit, theme, and publish a creator's personalized public page at contentlead.in/<handle> ("Storefront Studio") from any AI agent. Use for creating/arranging a handle owner's page from TYPED, allowlisted sections (profile hero, featured links, about, follow-me, shop offers, proof, brand CTA, footer, gallery, embed, FAQ, marquee), applying starter kits + theme vibes, curated animated/patterned backgrounds, editing per-section props, generating a whole page from the creator's real profile with AI, and the draft → preview → publish lifecycle. All via one command surface at /api/storefront/commands/<name>. Sibling to cl-offers (which builds sales/checkout pages); this builds the creator's own link-in-bio / storefront page. NOT the desktop editor (that is cl-editor).
tags: storefront, creator page, handle page, link in bio, contentlead.in/handle, storefront studio, sections, typed sections, vibe, kit, theme, draft, publish, generateFromProfile, storefront commands, creator storefront
---

# ContentLead Creator Bio Page — AI Agent Skill

Control **Storefront Studio** — the builder that ships a creator's **personalized public bio page** at `contentlead.in/<handle>` (their link-in-bio / storefront) — from any AI agent.

Like `cl-offers` (and unlike `cl-editor`, which talks to the desktop app), this runs in the ContentLead web app at `contentlead.in`. Commands go to the user's authenticated session, not a local port.

> **Owns the question:** *"How do I programmatically build/edit/theme/publish a creator's `contentlead.in/<handle>` bio page — what sections exist, what commands drive it, and how does draft/publish work?"*
> **Sibling:** `cl-offers` (sales page / checkout / thank-you / emails). **Not:** `cl-editor` (desktop video editor).

## 🧩 Typed sections by default — with ONE custom-code escape hatch

**Prefer typed, allowlisted sections.** Almost everything is built from **typed sections** (`{ id, type, variant, props }`) rendered by server-owned React components: text renders as plain JSX text, URLs pass a safe-URL validator, colors are validated hex, embeds are parsed from provider-allowlisted URLs. Animated/patterned backgrounds, glass surfaces, tints, and entrance animations are **curated theme tokens** — you get premium visuals without writing code. Use these for all standard content. **User images:** sections take images by https URL, and a creator's OWN image (a local file, a screenshot) can be uploaded with `storefront.media.upload` to get a hosted URL — see the Media commands below.

**But there IS a custom-code path — `customCode` (offers parity).** When the typed sections genuinely can't express what you need (a bespoke hero, a one-off animated block, an unusual layout), add a `customCode` section and write a real React component with **`storefront.section.setCode { id, code }`**. This reuses Offer Studio's exact, already-shipped sandbox:

- The server transpiles your JSX with `transpileSectionCode` (@babel) at write time → `compiledCode`.
- The page executes it **CLIENT-ONLY** via `executeSectionCode` (`new Function`) inside `StorefrontCustomSection` — SSR never evals authored code, and the login cookie is `httpOnly` so injected JS can't read it (same threat model offers already accepts).
- Rules (validated): define `const Section = () => (...)`; **no `import`/`export`**; use only the **pre-injected globals** — `React`, `motion`, `AnimatePresence`, `useInView`, `Icons`, `THEME`, layout primitives (`SectionContainer`, `Container`, `Grid`, `Flex`, `Columns`, `Spacer`, `AspectRatio`) and UI primitives (`Button`, `Badge`, `Card`, `Divider`, `GlowCard`, `GradientText`, `Accordion`, `Tabs`, `ProgressBar`, `Avatar`, `Marquee`, `Tooltip`, `Stat`, `Chip`, …) — the **same set offer sections get**. `code` is length-capped (20k) and won't compile if the JSX is invalid.
- **Tradeoff:** custom sections render client-side only → that block doesn't SSR (minor SEO cost). For SEO-critical copy prefer typed `about`/`featuredLinks`. The **honesty firewall still applies** — never fabricate metrics/testimonials/prices/URLs even in custom code.

So: typed sections + curated animated backgrounds for 95% of pages; `customCode` for the genuinely bespoke 5%.

## 🚨 Startup protocol

The user must be:
1. Signed in to `https://contentlead.in` in a browser (agents via the desktop bridge auto-pass session cookies), AND
2. Have a **claimed handle**. If not, claim one first:
   ```bash
   POST /api/user/handle   { "handle": "<lowercase-handle>", "displayName": "<name>?" }
   ```
   (handle = lowercase letters, numbers, `-`, `_`.) Without a handle, every storefront command fails with a 400 `Claim your handle first`.

You do NOT read `~/.skilltown-desktop/api.json` for this skill — there is no local port. Commands target the user's session directly.

> **⚙️ If you run via the desktop bridge** (session cookies come from the app) **and it isn't running,** start it first — **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"` (see `cl-editor/infrastructure.md`). If you call `contentlead.in` directly with the user's browser session, no app start is needed — just ensure they're signed in.

**First discovery call:**
```bash
POST /api/storefront/commands/storefront.getState   { "params": {} }
# → { handle, isPublished, publishedAt, draft, published, hasDraftChanges }
```
`draft` and `published` are each a full `StorefrontPageConfig` (`{ schemaVersion, theme, sections }`). All edits mutate the **draft**; the public page shows the **published** copy only.

## Command surface — one endpoint, 25 commands

Every command is called the same way:
```bash
POST /api/storefront/commands/<commandName>
Content-Type: application/json
{ "params": { ... } }
```
Envelope: `{ ok, command, result, error?, validationErrors? }`. For mutating commands, `result` is `{ ok: true, data: { draft }, message }` — **read the new draft from `result.data.draft`** and (in a UI) reload the preview.

Or via the higher-level AI runner (SSE — the model plans + dispatches these same commands):
```bash
POST /api/storefront/ai   { "prompt": "Make my page a warm minimal creator hub and feature my YouTube + newsletter" }
# → text/event-stream: {type:"thinking"|"command"|"result"|"final"|"error", ...}
```

### State & catalog (read-only)
| Command | Params | Returns |
|---|---|---|
| `storefront.getState` | `{}` | `{ handle, isPublished, publishedAt, draft, published, hasDraftChanges }` |
| `storefront.listCatalog` | `{}` | Addable section types + variants + `allowMultiple`/`dataBound` (includes `gallery`, `embed`, `faq`, `marquee`) |
| `storefront.listKits` | `{}` | Starter kits `[{ id, label, description }]` |
| `storefront.listVibes` | `{}` | Theme vibe presets `[{ id, label, description, theme }]` |

### Whole-draft / layout
| Command | Params | Notes |
|---|---|---|
| `storefront.applyKit` | `{ kitId }` | Replaces the draft with a starter kit (ordered sections + matching vibe) |
| `storefront.applyVibe` | `{ vibeId }` | Apply a theme vibe preset to the draft |
| `storefront.reorder` | `{ ids: string[] }` | Reorder sections by id (omitted ids appended) |
| `storefront.discardDraft` | `{}` | Revert the draft to the published page (or a data-bound default) — does NOT change what's public |

### Sections
| Command | Params | Notes |
|---|---|---|
| `storefront.section.add` | `{ type, variant?, index?, props? }` | Add a typed section; singletons + `MAX_SECTIONS`(24) enforced. Presentation props like `anim`/`tint` can be passed here. |
| `storefront.section.remove` | `{ id }` | Remove a section |
| `storefront.section.move` | `{ id, toIndex }` | Move one section |
| `storefront.section.duplicate` | `{ id }` | Duplicate (only `allowMultiple` types) |
| `storefront.section.setProps` | `{ id, props }` | Merge editable props (text capped, URLs safe-validated, embeds provider-allowlisted). Presentation props like `anim`/`tint` work on any section. |
| `storefront.section.setCode` | `{ id, code, minHeight? }` | **Custom-code section only.** Server-transpiles your JSX (`const Section = () => (...)`, no import/export) and stores `{ code, compiledCode }`; runs CLIENT-only in the offers sandbox. Returns a validation error if it doesn't compile. |
| `storefront.section.setVariant` | `{ id, variant }` | Switch the section's layout variant |
| `storefront.section.setHidden` | `{ id, hidden }` | Show/hide without deleting |

### Media (user images)
| Command | Params | Notes |
|---|---|---|
| `storefront.media.upload` | `{ dataUrl, fileName }` | Upload a user's OWN image (local file path, screenshot, or pasted bytes → base64 `data:image/...;base64,...`). Returns `{ file: { name, url, size, contentType, lastModified } }`. Use `file.url` in a `gallery` image, a `profileHero` `avatarOverride`, an `embed` `poster`, a `customCode` `<img src>`, or any image prop. Allowed: png/jpeg/webp/gif, ≤5MB. |
| `storefront.media.list` | `{}` | List the creator's uploaded media library `{ files: [...] }` (shared with Offer Studio). |
| `storefront.media.delete` | `{ name? , url? }` | Delete one uploaded image (own prefix only). |

### Theme
| Command | Params | Notes |
|---|---|---|
| `storefront.theme.set` | `{ tokens }` | Merge partial `StorefrontThemeTokens` onto the draft theme (see below) |

### AI + lifecycle
| Command | Params | Notes |
|---|---|---|
| `storefront.generateFromProfile` | `{ goal? }` | Build a whole draft from the creator's REAL profile data (honesty firewall — see below) |
| `storefront.publish` | `{}` | Copy draft → published, mark handle published, revalidate the public URL |
| `storefront.unpublish` | `{}` | Take the public page offline (draft preserved) |

## The 13 typed section families (+ 1 custom-code)

Pass `type` to `section.add`. Every section has variants (see `listCatalog`).

| `type` | What it shows | Data-bound? | Creator free-text? |
|---|---|---|---|
| `profileHero` | Avatar, name, headline, niches | ✅ real profile | `headlineOverride`; optional `avatarOverride` (safeHttpUrl image — upload or library) |
| `featuredLinks` | Curated link buttons | — | ✅ `heading` + `links:[{label,url,subtitle?}]` (URLs safe-validated) |
| `about` | About / bio prose | — | ✅ `heading` + `body` |
| `followMe` | Social follow buttons | ✅ real social links | — |
| `shopOffers` | The creator's sellable offers (title, live price, checkout link) | ✅ real offers | `heading`; optional `offerNames` filter/reorder (empty = show all) |
| `proof` | Honest activity (tracked views, campaigns, verified) | ✅ real proof | — |
| `brandCta` | "Work with me" brand-inquiry form | ✅ (auto-hides unless `acceptsBrandInquiries`) | — |
| `footer` | Handle + ContentLead footer | ✅ | — |
| `gallery` | Image grid/masonry/carousel | — | ✅ `heading?` + `images:[{url,caption?,link?}]` (image/link URLs safe-validated) |
| `embed` | One safe media embed (YouTube / Vimeo / Spotify) | — | ✅ pass a normal watch/track `url`; server parses allowlisted provider + id and stores `{heading?,embedUrl,provider}`; optional `poster` (safeHttpUrl image → click-to-play cover, non-Spotify) |
| `faq` | Q&A section | — | ✅ `heading?` + `items:[{q,a}]` |
| `marquee` | Scrolling row of short text chips | — | ✅ `items:string[]` |
| `customCode` | **A real React component you author** (bespoke/anything typed sections can't do) | — | ✅ via `storefront.section.setCode` — `code` (JSX, `const Section`), client-only sandbox |

**Variants:** `gallery` supports `grid`, `masonry`, `carousel`; `embed` supports `card`, `plain`; `faq` supports `accordion`, `list`; `marquee` supports `line`, `chips`; `customCode` has one `default` variant.

**Honesty firewall (enforced server-side, not a guideline):** data-bound sections render ONLY real DTO data and auto-hide when there's nothing real — you cannot fabricate followers, testimonials, prices, or metrics. Non-data-bound sections (`featuredLinks`, `about`, `gallery`, `embed`, `faq`, `marquee`, plus the hero `headlineOverride`) carry creator-supplied data, but it is still safe: text is plain, URLs are safeHttpUrl-validated, and embeds are provider-allowlisted.

### Per-section presentation props

These work on **any** section via `storefront.section.add { props }` or `storefront.section.setProps { id, props }`:

| Prop | Values | Notes |
|---|---|---|
| `anim` | `none` \| `fade` \| `rise` \| `float` \| `zoom` \| `slide` | Staggered entrance animation; disabled when theme `motion` is `off` (and reduced for users who prefer reduced motion). |
| `tint` | boolean | Wraps the section in a subtle brand-tinted band. |

## Theme tokens (`storefront.theme.set { tokens }`)

Partial merge; every value is validated. Colors must be hex (`#rgb`/`#rrggbb`) or they're dropped.

| Token | Values |
|---|---|
| `colorScheme` | `light` \| `dark` |
| `brand`, `brandContrast`, `accent`, `bg`, `surface`, `border`, `text`, `muted` | validated hex color |
| `fontHeading`, `fontBody` | `inter` \| `geist` \| `system` \| `serif` \| `playfair` \| `mono` \| `rounded` (allowlisted keys → server-owned font stacks; raw CSS never accepted) |
| `fontScale` | `compact` \| `cozy` \| `spacious` |
| `radius` | `none` \| `subtle` \| `rounded` \| `pill` |
| `backgroundStyle` | `solid` \| `gradient` \| `soft` \| `animated-gradient` \| `aurora` \| `mesh` \| `grid` \| `dots` \| `spotlight` |
| `accent2` | validated hex color |
| `gradientAngle` | number `0`–`360` |
| `motion` | `off` \| `calm` \| `lively` |
| `glass` | boolean |

**Animated/patterned backgrounds:** `backgroundStyle` now supports server-owned curated values in addition to the original `solid`/`gradient`/`soft`: `animated-gradient`, `aurora`, `mesh`, `grid`, `dots`, `spotlight`.

Example:
```json
{ "tokens": { "backgroundStyle": "aurora", "motion": "lively", "glass": true } }
```

- `accent2` powers multi-stop/animated gradients, mesh blobs, and glow.
- `gradientAngle` controls gradient direction and animation angle.
- `motion` controls global speed for animated backgrounds **and** section entrance animations; `off` disables all motion and the renderer also respects `prefers-reduced-motion`.
- `glass` enables frosted-glass translucent surfaces that look premium over animated/patterned backgrounds.
- These are curated theme tokens (validated, server-owned) — for **raw custom code** use the `customCode` section + `storefront.section.setCode` instead.

**Vibe presets** (`applyVibe { vibeId }`): `warm-amber`, `midnight`, `mono-ink`, `sunset`, `forest`, `grape`.
**Starter kits** (`applyKit { kitId }`): `creator-hub`, `portfolio`, `expert-coach`, `seller`, `showcase` ("Lead with visuals — gallery, an embed and your links").

## Draft → Preview → Publish lifecycle

1. All edits mutate `draftConfig`; nothing is public yet.
2. **Owner-only draft preview:** `GET https://contentlead.in/<handle>/preview` (session-gated, noindex, never cached) renders the live draft with a "Draft preview" banner. Use it as the builder's preview iframe (reload after each mutation).
3. `storefront.publish` copies draft → `pageConfig`, sets `isPublished`, and revalidates the public route on demand.
4. Public page: `GET https://contentlead.in/<handle>` renders the published typed page (falls back to the legacy block storefront if no personalized page is published).

## Typical flows

### 1. Generate a page from the creator's real profile, then publish
```
1. storefront.getState {}                                  # ensure handle exists (else POST /api/user/handle)
2. storefront.generateFromProfile { goal: "grow my audience" }
3. (open /<handle>/preview to review)
4. storefront.section.setProps { id: "<aboutId>", props: { body: "..." } }   # tweak copy
5. storefront.publish {}
```

### 2. Hand-build a warm minimal hub
```
1. storefront.applyKit { kitId: "creator-hub" }
2. storefront.applyVibe { vibeId: "warm-amber" }
3. storefront.section.add { type: "featuredLinks", props: { heading: "Start here",
     links: [{ label: "My newsletter", url: "https://..." }, { label: "YouTube", url: "https://youtube.com/@me" }] } }
4. storefront.theme.set { tokens: { brand: "#e08a2b", radius: "rounded", fontHeading: "playfair" } }
5. storefront.reorder { ids: ["<hero>", "<about>", "<links>", "<follow>", "<footer>"] }
6. storefront.publish {}
```

### 3. What's new: visual showcase with curated motion
```
1. storefront.applyVibe { vibeId: "sunset" }
2. storefront.theme.set { tokens: { backgroundStyle: "aurora", motion: "lively", glass: true,
     accent: "#ff7a59", accent2: "#8b5cf6", gradientAngle: 135 } }
3. storefront.section.add { type: "gallery", variant: "masonry", props: { heading: "Recent work",
     images: [{ url: "https://...", caption: "Launch day", link: "https://..." }] } }
4. storefront.section.add { type: "embed", variant: "card", props: { heading: "Watch the intro",
     url: "https://youtu.be/..." } }   # server converts allowlisted provider URL → canonical embed
5. storefront.section.setProps { id: "<galleryId>", props: { anim: "rise", tint: true } }
6. storefront.section.setProps { id: "<embedId>", props: { anim: "rise" } }
7. (open /<handle>/preview to review)
8. storefront.publish {}
```

This flow uses only existing commands (`storefront.theme.set`, `storefront.section.add`, `storefront.section.setProps`, `storefront.publish`). The motion/background/glass choices are validated, server-owned presentation tokens.

### 4. Custom-code block (offers parity) — for the genuinely bespoke
```
1. storefront.section.add { type: "customCode" }            # returns the new section id
2. storefront.section.setCode {
     id: "<customCodeId>",
     code: "const Section = () => (\n  <SectionContainer>\n    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}>\n      <GradientText style={{ fontSize: 40, fontWeight: 800 }}>Ship faster.</GradientText>\n    </motion.div>\n    <Button href=\"https://contentlead.in\">Start now</Button>\n  </SectionContainer>\n);"
   }
3. (open /<handle>/preview to review — the block runs client-side)
4. storefront.publish {}
```
`code` must define `const Section`, use only pre-injected globals (React, motion, Icons, THEME, layout/UI primitives — same set as offer sections), and carries NO import/export. It transpiles server-side and runs client-only in the offers sandbox. Prefer typed sections for standard content; reach for `customCode` only when needed. The honesty firewall still applies.

### 5. Add a user's OWN image (upload → gallery)
```
1. (read the user's file as a base64 data URL — from a path they gave you, or a screenshot)
2. storefront.media.upload { dataUrl: "data:image/png;base64,iVBORw0K…", fileName: "hero.png" }
     # → result.data.file.url = "https://…blob…/hero.png"
3. storefront.section.add { type: "gallery", variant: "masonry",
     props: { heading: "From the workflow",
       images: [{ url: "<file.url from step 2>", caption: "Launch day" }] } }
   # …or drop <img src="<file.url>" /> inside a customCode block
4. (open /<handle>/preview to review)
5. storefront.publish {}
```
Uploaded images are stored in the creator's own media library (shared with Offer Studio) and served from a hosted https URL. png/jpeg/webp/gif, ≤5MB. The builder UI also exposes this as **Upload image** buttons in the Gallery and Custom-code editors.

### 6. Revert a bad edit / take offline
```
storefront.discardDraft {}     # draft back to the published version
storefront.unpublish {}        # hide the public page (draft kept)
```

## Owner UI

The human builder lives at **`/deals/creator/storefront`** ("My Page" in the Deals sidebar): preview-first, mobile-frame live iframe, vibe/kit pickers, per-section editors with tints, Generate, Publish/Unpublish, Discard. It drives exactly the commands above.

**Image fields** (profileHero avatar, embed poster, gallery images, customCode) each offer **Upload** (`storefront.media.upload`) **and "Choose from library"** — a picker modal listing prior uploads (`storefront.media.list`) so images can be reused across sections without re-uploading. The media library is shared with Offer Studio.

## Error handling

- Success: `{ ok: true, result: { ok: true, data, message } }`. Failure: `{ ok: false, error }` (+ `validationErrors` for bad params). HTTP: 401 = not signed in; 400 = validation error or `Claim your handle first`; 500 = server error.
- Params are strict (`additionalProperties: false`) — you cannot smuggle a `userId`/`handleId`; identity is always the signed-in session.
- If a section id isn't found, re-read `storefront.getState` — ids are regenerated on some whole-draft ops (`applyKit`, `generateFromProfile`, `discardDraft`).

## Where the code lives (for maintainers)

- Contracts: `SkillTown/lib/creatorStorefront/page/{types,theme,sectionSchema,defaults}.ts`
- Render: `SkillTown/lib/creatorStorefront/page/{sections/*,registry,StorefrontPageView}.tsx`
- Service + pure ops: `SkillTown/lib/creatorStorefront/{service,pageOps}.ts`
- Commands: `SkillTown/lib/storefront-studio/commands/*` → routes `SkillTown/app/api/storefront/{commands/[name],ai}/route.ts`
- Public + preview routes: `SkillTown/app/[handle]/{page.tsx,preview/page.tsx}`
- Builder UI: `SkillTown/app/deals/creator/storefront/StorefrontPageBuilderClient.tsx`
- Persistence: additive `CreatorHandle.pageConfig` (published) + `draftConfig` (draft) JSON columns.

## Related skills

- **cl-offers** — sibling: builds the sales/checkout/thank-you/email surfaces (`/api/offer-studio/commands/*`). A `shopOffers` section surfaces those offers on the creator page.
- **cl-content-publishing** — publish the reel that drives traffic to `contentlead.in/<handle>`.
- **cl-editor** — the desktop video editor (different command surface entirely).
