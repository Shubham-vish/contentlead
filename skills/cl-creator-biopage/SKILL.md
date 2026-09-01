---
name: cl-creator-biopage
description: Build, edit, theme, and publish a creator's personalized public page at contentlead.in/<handle> ("Storefront Studio") from any AI agent. Use for creating/arranging a handle owner's page from TYPED, allowlisted sections (profile hero, featured links, about, follow-me, shop offers, proof, brand CTA, footer), applying starter kits + theme vibes, editing per-section props, generating a whole page from the creator's real profile with AI, and the draft → preview → publish lifecycle. All via one command surface at /api/storefront/commands/<name>. Sibling to cl-offers (which builds sales/checkout pages); this builds the creator's own link-in-bio / storefront page. NOT the desktop editor (that is cl-editor).
tags: storefront, creator page, handle page, link in bio, contentlead.in/handle, storefront studio, sections, typed sections, vibe, kit, theme, draft, publish, generateFromProfile, storefront commands, creator storefront
---

# ContentLead Creator Bio Page — AI Agent Skill

Control **Storefront Studio** — the builder that ships a creator's **personalized public bio page** at `contentlead.in/<handle>` (their link-in-bio / storefront) — from any AI agent.

Like `cl-offers` (and unlike `cl-editor`, which talks to the desktop app), this runs in the ContentLead web app at `contentlead.in`. Commands go to the user's authenticated session, not a local port.

> **Owns the question:** *"How do I programmatically build/edit/theme/publish a creator's `contentlead.in/<handle>` bio page — what sections exist, what commands drive it, and how does draft/publish work?"*
> **Sibling:** `cl-offers` (sales page / checkout / thank-you / emails). **Not:** `cl-editor` (desktop video editor).

## 🔒 The one rule that makes this different from cl-offers

**There is NO creator code.** Offer Studio has `offer.builder.updateCode` (inline React) — Storefront Studio deliberately does **not**. A creator page is built ONLY from **typed, allowlisted sections** (`{ id, type, variant, props }`) rendered by server-owned React components. This is a hard security boundary (principal-eng + UX reviewed): the page lives on the shared, same-origin `contentlead.in` multi-tenant host, so executing creator JSX/CSS would be SSR/ISR RCE + same-origin XSS. Everything a creator supplies is **data**: text renders as plain JSX text, URLs pass a safe-URL validator, colors are validated hex. Never look for or expect a "paste your own code / HTML / CSS" command — it does not exist by design.

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

## Command surface — one endpoint, 19 commands

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
| `storefront.listCatalog` | `{}` | Addable section types + variants + `allowMultiple`/`dataBound` |
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
| `storefront.section.add` | `{ type, variant?, index?, props? }` | Add a typed section; singletons + `MAX_SECTIONS`(24) enforced |
| `storefront.section.remove` | `{ id }` | Remove a section |
| `storefront.section.move` | `{ id, toIndex }` | Move one section |
| `storefront.section.duplicate` | `{ id }` | Duplicate (only `allowMultiple` types) |
| `storefront.section.setProps` | `{ id, props }` | Merge editable props (text capped, URLs safe-validated) |
| `storefront.section.setVariant` | `{ id, variant }` | Switch the section's layout variant |
| `storefront.section.setHidden` | `{ id, hidden }` | Show/hide without deleting |

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

## The 8 typed section families

Pass `type` to `section.add`. Every section has variants (see `listCatalog`).

| `type` | What it shows | Data-bound? | Creator free-text? |
|---|---|---|---|
| `profileHero` | Avatar, name, headline, niches | ✅ real profile | `headlineOverride` only |
| `featuredLinks` | Curated link buttons | — | ✅ `heading` + `links:[{label,url,subtitle?}]` (URLs safe-validated) |
| `about` | About / bio prose | — | ✅ `heading` + `body` |
| `followMe` | Social follow buttons | ✅ real social links | — |
| `shopOffers` | The creator's sellable offers (title, live price, checkout link) | ✅ real offers | `heading`; optional `offerNames` filter/reorder (empty = show all) |
| `proof` | Honest activity (tracked views, campaigns, verified) | ✅ real proof | — |
| `brandCta` | "Work with me" brand-inquiry form | ✅ (auto-hides unless `acceptsBrandInquiries`) | — |
| `footer` | Handle + ContentLead footer | ✅ | — |

**Honesty firewall (enforced server-side, not a guideline):** data-bound sections render ONLY real DTO data and auto-hide when there's nothing real — you cannot fabricate followers, testimonials, prices, or metrics. Only `featuredLinks`, `about`, and the hero `headlineOverride` carry creator free-text.

## Theme tokens (`storefront.theme.set { tokens }`)

Partial merge; every value is validated. Colors must be hex (`#rgb`/`#rrggbb`) or they're dropped.

| Token | Values |
|---|---|
| `colorScheme` | `light` \| `dark` |
| `brand`, `brandContrast`, `accent`, `bg`, `surface`, `border`, `text`, `muted` | validated hex color |
| `fontHeading`, `fontBody` | `inter` \| `geist` \| `system` \| `serif` \| `playfair` \| `mono` \| `rounded` (allowlisted keys → server-owned font stacks; raw CSS never accepted) |
| `fontScale` | `compact` \| `cozy` \| `spacious` |
| `radius` | `none` \| `subtle` \| `rounded` \| `pill` |
| `backgroundStyle` | `solid` \| `gradient` \| `soft` |

**Vibe presets** (`applyVibe { vibeId }`): `warm-amber`, `midnight`, `mono-ink`, `sunset`, `forest`, `grape`.
**Starter kits** (`applyKit { kitId }`): `creator-hub`, `portfolio`, `expert-coach`, `seller`.

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

### 3. Revert a bad edit / take offline
```
storefront.discardDraft {}     # draft back to the published version
storefront.unpublish {}        # hide the public page (draft kept)
```

## Owner UI

The human builder lives at **`/deals/creator/storefront`** ("My Page" in the Deals sidebar): preview-first, mobile-frame live iframe, vibe/kit pickers, per-section editors with tints, Generate, Publish/Unpublish, Discard. It drives exactly the commands above.

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
