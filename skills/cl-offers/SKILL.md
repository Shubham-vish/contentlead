---
name: cl-offers
description: Build, edit, brand, and manage ContentLead Offer Studio surfaces (offer sales pages, checkout, thank-you, buyer emails) end-to-end from any AI agent. Use for creating paid offers AND free lead-magnets, adding/removing/rearranging sections, editing copy, swapping templates, applying page presets, wiring buyer actions (CTA, validate phone/email, apply coupon, submit lead), configuring checkout (price, GST, bonuses, upsells, order bumps), fully BRANDING the checkout + thank-you pages (colors, fonts, copy, custom CSS, style presets, default phone country), managing coupons, products/deliverables, media generation, and theme presets. Covers all four surfaces via one endpoint `/api/offer-studio/commands/<name>`.
---

# ContentLead Offers — AI Agent Skill

Control the ContentLead **Offer Studio** — the builder that ships full sales pages, checkout, thank-you, and buyer emails for any digital offer — from any AI agent.

Unlike `cl-editor` (which talks to the desktop app), Offer Studio runs in the ContentLead web app at `contentlead.in`. Commands go to the user's authenticated session, not a local port.

## 🚨 Startup protocol

The user must be:
1. Signed in to `https://contentlead.in` in a browser, AND
2. Have at least one offer created (or explicitly ask you to create one via `offer.create`).

You do NOT read `~/.skilltown-desktop/api.json` for this skill. There is no local port. Commands target the user's session directly through the ContentLead app (agents integrated via the desktop bridge auto-pass session cookies).

> **⚙️ If you run via the desktop bridge** (session cookies come from the app) **and it isn't running,** start it first — **macOS** `open -a "ContentLead"` · **Windows (PowerShell)** `Start-Process "$env:LOCALAPPDATA\Programs\ContentLead\ContentLead.exe"` (see `cl-editor/infrastructure.md`). If instead you call `contentlead.in` directly with the user's browser session, no app start is needed — just ensure they're signed in.

**First discovery call:**
```bash
POST /api/offer-studio/commands/offer.list
# → returns every offer the user owns with names, surfaces, and last-edited times
```

Pick a target `offerName` before touching any of the surface commands below.

## Command surface — one endpoint, ~78 commands

Every command is called the same way. `offerName` may sit at the top level OR inside `params` (both work; the server reads `body.params ?? {}`):

```bash
POST /api/offer-studio/commands/<commandName>
Content-Type: application/json
{ "offerName": "weekend-course", "params": { ... } }
```

Or via the higher-level AI runner (which asks the model to plan and then dispatches):

```bash
POST /api/offer-studio/ai
{ "prompt": "Add a testimonials section to the offer 'weekend-course' and swap the hero template" }
```

Every command self-describes — `GET /api/offer-studio/commands/<name>` (or the manifest at `lib/offer-studio/commands/manifest.ts`) returns `summary`, `description`, `paramsSchema`, and `examples`. When unsure of a param name, read the manifest rather than guessing.

## The four surfaces

An offer is a bundle of four independently editable surfaces:

| Surface | What it is | Ships as |
|---|---|---|
| `offer` | The sales page (hero → benefits → testimonials → CTA) | `/o/<offerName>` |
| `checkout` | The checkout flow (customer form, order summary, coupon, upsell, payment) | Presented as page / drawer / dialog / inline |
| `thankyou` | Post-purchase confirmation + next steps | `/o/<offerName>/thanks` |
| `email` | Buyer email templates (receipt, welcome, delivery) | Sent by transactional email |

Every builder command takes `{ offerName, surface, ... }` and edits **only that surface**.

## Command categories

### Offers (top-level)

| Command | Params | Notes |
|---|---|---|
| `offer.list` | — | Returns every offer the user owns |
| `offer.create` | `{ name, title?, template? }` | Creates a blank offer (auto-picks a starter kit if template is omitted) |
| `offer.rename` | `{ offerName, newName }` | Renames slug; updates all links |
| `offer.duplicate` | `{ offerName, newName? }` | Full clone incl. all four surfaces |

### Builder — sections (the daily-driver commands)

Applies to every surface. Pass `surface: "offer" | "checkout" | "thankyou" | "email"`.

| Command | Params | Notes |
|---|---|---|
| `offer.builder.list` | `{ offerName, surface }` | Returns section list with IDs + template names |
| `offer.builder.listTemplates` | `{ surface }` | Every available section template for that surface |
| `offer.builder.listPresets` | `{ surface }` | Full-page starter kits (Hero-first, Long-form, Minimalist, etc.) |
| `offer.builder.add` | `{ offerName, surface, template, position? }` | Adds a section from a template |
| `offer.builder.remove` | `{ offerName, surface, sectionId }` | Deletes a section |
| `offer.builder.move` | `{ offerName, surface, sectionId, position }` | Reorders |
| `offer.builder.duplicate` | `{ offerName, surface, sectionId }` | Duplicates a section |
| `offer.builder.rename` | `{ offerName, surface, sectionId, label }` | Renames a section |
| `offer.builder.setSpacing` | `{ offerName, surface, sectionId, spacing }` | `"none" \| "sm" \| "md" \| "lg"` |
| `offer.builder.setHidden` | `{ offerName, surface, sectionId, hidden }` | Hides without deleting |
| `offer.builder.setPageSettings` | `{ offerName, surface, patch }` | Page-level settings (theme override, presentation mode, meta) |
| `offer.builder.updateCode` | `{ offerName, surface, sectionId, code }` | Replace a section's inline React code directly |
| `offer.builder.rewriteWithAI` | `{ offerName, surface, sectionId, instruction }` | Model rewrites the section |
| `offer.builder.swapTemplate` | `{ offerName, surface, sectionId, template }` | Replace template while preserving copy |
| `offer.builder.generatePage` | `{ offerName, surface, prompt }` | Model builds a full page from a prompt |
| `offer.builder.applyPagePreset` | `{ offerName, surface, presetId }` | One-shot: swap in an entire preset kit |

### Builder — actions (buyer interactions)

Actions are named buyer interactions any button can bind to: `applyCoupon`, `validateEmail`, `submitCheckout`, `openWhatsApp`, `scrollToSection`, etc. Users can also author custom actions with a body of JS.

| Command | Params | Notes |
|---|---|---|
| `offer.builder.listActions` | `{ offerName, surface? }` | Lists built-in + user's custom actions with `useAction("name")` snippets |
| `offer.builder.createAction` | `{ offerName, name, label, params?, body?, endpointUrl? }` | Create a custom action |
| `offer.builder.updateAction` | `{ offerName, name, patch }` | Update body / params / label |
| `offer.builder.deleteAction` | `{ offerName, name }` | Remove a custom action |
| `offer.builder.attachAction` | `{ offerName, surface, sectionId, actionName, target }` | Bind an action to a section element |
| `offer.builder.detachAction` | `{ offerName, surface, sectionId, target }` | Unbind |
| `offer.builder.generateAction` | `{ offerName, prompt }` | Model authors a custom action for you |

### Checkout — commerce config

| Command | Params |
|---|---|
| `offer.checkout.setTitle` | `{ offerName, title }` |
| `offer.checkout.setBasePrice` | `{ offerName, amount, currency? }` |
| `offer.checkout.setGstRate` | `{ offerName, rate }` |
| `offer.checkout.addBonus` | `{ offerName, name, description?, value? }` |
| `offer.checkout.removeBonus` | `{ offerName, bonusId }` |
| `offer.checkout.setSuccessMessage` | `{ offerName, message }` |
| `offer.checkout.setUrgencyText` | `{ offerName, text }` |
| `offer.checkout.addUpsell` | `{ offerName, name, price, description? }` |
| `offer.checkout.removeUpsell` | `{ offerName, upsellId }` |
| `offer.checkout.setOrderBump` | `{ offerName, name?, price?, description? }` |

### Checkout — presentation mode

Set how checkout appears on the sales page:

```bash
POST /api/offer-studio/commands/offer.builder.setPageSettings
{ "params": {
  "offerName": "weekend-course",
  "surface": "checkout",
  "patch": { "presentationMode": "drawer" }
}}
```

Modes: `page` (dedicated route), `drawer` (right-side slide-in), `dialog` (center modal), `inline` (in-flow on offer page).

## Checkout & thank-you BRANDING (make it look custom)

The checkout and thank-you pages are fully brandable — colors, typography, copy, backgrounds, and even raw CSS — without writing a new page. This is how you make a checkout that looks bespoke while keeping the proven, secure payment flow.

### `offer.checkout.setStyle` — brand the checkout

`{ offerName, style: { ...only the keys you want to change } }`. Merge semantics: unspecified keys are left untouched. Undo restores the previous style. Colors are hex.

| Group | Fields |
|---|---|
| **Palette** | `accentColor`, `bgColor`, `cardBgColor`, `cardTextColor`, `pageTitleColor` |
| **Buttons** | `buttonStyle` (`solid`\|`gradient`), `buttonGradientTo`, `buttonRadius` (`rounded`\|`pill`\|`square`) |
| **Cards** | `cardStyle` (`dark` default \| `light` honours `cardBgColor`), `cardBorderRadius` (`none`→`2xl`), `cardShadow` (`none`\|`sm`\|`lg`\|`2xl`) |
| **Background** | `backgroundStyle` (`solid`\|`gradient`\|`animated`), `bgGradientFrom/Via/To`, `bgGradientAngle` (0-360) |
| **Typography** | `fontScale` (0.6–1.6 global multiplier), `theme` (`dark` default \| `light` remaps bar/footer/notices) |
| **Header copy** | `headerTitle`, `headerSubtitle` |
| **Button copy** | `payButtonText`, `buttonText` (step-one continue), `buttonSubtext` |
| **Notice** | `noticeText`, `noticeEnabled`, `noticeStyle` (`warning`\|`info`\|`success`\|`minimal`) |
| **Coupon** | `showCouponField` |
| **Trust / badges** | `securityBadgesEnabled`, `badgeText1`, `badgeText2`, `guaranteeEnabled`, `guaranteeText`, `guaranteeSubtext`, `trustHeaderTitle`, `trustHeaderSubtitle`, `showTrustFooter`, `footerText`, `showPoweredBy` |
| **Phone default** | `defaultPhoneCountry` — ISO2 code (e.g. `IN`) sets the default phone dial code |
| **Escape hatch** | `customCss` — owner CSS injected **scoped under `#st-checkout-root` via `@scope`**. Style any element. Caveat: a stray `}` can break out of the scope block, so keep rules well-formed; `</style>`/`</script>` are stripped. |

```bash
POST /api/offer-studio/commands/offer.checkout.setStyle
{ "params": { "offerName": "glow-ritual", "style": {
    "accentColor": "#b8860b", "cardStyle": "light", "cardBgColor": "#fffdf7",
    "backgroundStyle": "animated", "bgGradientFrom": "#fff7ed", "bgGradientTo": "#fde6c8",
    "payButtonText": "Secure your seat", "defaultPhoneCountry": "IN", "showCouponField": false
}}}
```

### `offer.thankyou.setStyle` — brand the post-payment page

`{ offerName, style: { ... } }`. Merges into `Checkout.thankYouConfig`.

| Group | Fields |
|---|---|
| **Copy** | `headline`, `subheadline` |
| **Background** | `bgColor`, `backgroundStyle` (`solid`\|`gradient`\|`animated`), `bgGradientFrom/Via/To`, `bgGradientAngle` |
| **Typography** | `fontScale` (0.6–1.6), `theme` (`dark`\|`light`) |
| **Next steps** | `whatsappLink`, `contactEmail`, `instagramHandle`, `exploreUrl`, `exploreLabel` |
| **Escape hatch** | `customCss` — scoped under `#st-thankyou-root` via `@scope` |

### `offer.style.applyPreset` / `offer.style.listPresets` — one-shot brand kits

`offer.style.applyPreset { offerName, presetId }` styles **both** checkout + thank-you together in one call (undo restores prior checkout style). `offer.style.listPresets` is auth-free and returns the gallery.

| presetId | Look |
|---|---|
| `luxe-cream` | Warm cream page, animated glow, white cards, rose-gold accents — premium & soft |
| `midnight-neon` | Deep dark, subtle shifting gradient, electric-violet accents — bold & modern |
| `minimal-mono` | Clean solid-white, light cards, near-black accent, flat shadows — understated |
| `sunset-glow` | Peach→coral animated gradient, light cards, punchy orange — energetic & friendly |
| `ocean-calm` | Blue→teal gradient, light cards, calm teal accent — trustworthy & fresh |
| `royal-gold` | Rich navy dark, warm gold accents, deep shadows — luxe & authoritative |

**Fast path to a great-looking checkout:** `offer.style.applyPreset` first, then override 1–3 fields with `offer.checkout.setStyle` (e.g. swap `payButtonText`, set `defaultPhoneCountry`).

### ✅ What the proven checkout CAN vs CANNOT do

The checkout uses one hardened, secure payment component. You brand it richly, but you do **not** re-architect it.

| ✅ CAN customize | ❌ CANNOT (by design) |
|---|---|
| All colors, backgrounds, gradients, fonts (`fontScale`), light/dark themes | Add **new input fields** to the form — it is a fixed name / phone / email set (GST no., company, address are not supported) |
| Every piece of copy (headers, buttons, notice, guarantee, badges, footer) | Radically re-architect the fixed layout (two-column / single-page card structure is fixed) |
| Toggles: coupon field, security badges, guarantee, trust footer, powered-by, notice | Replace the Razorpay payment flow or move payment to an arbitrary AI-authored button (payment is shell-owned & hidden for security) |
| Pricing: base price, GST, bonuses, upsells, order bump, urgency, success message | — |
| Default phone country code | — |
| Arbitrary CSS via `customCss` (scoped) to restyle any element | — |

If a request needs a **new input field** or a **fundamentally different checkout layout**, say so plainly — that is a product change, not a styling command.


### Coupons

| Command | Params |
|---|---|
| `offer.coupon.create` | `{ offerName, code, discountPercent?, discountAmount?, expiresAt? }` |
| `offer.coupon.update` | `{ offerName, code, patch }` |
| `offer.coupon.delete` | `{ offerName, code }` |
| `offer.coupon.expire` | `{ offerName, code }` |

### Free lead-magnets — digital capture (`offer.digital.*`)

An offer is either a **paid product** or a **free lead-magnet**. For free offers there is **no checkout** — the buyer submits an on-page capture form (the `submitLead` action) and you deliver instantly. Configure this surface with:

| Command | Params | Notes |
|---|---|---|
| `offer.digital.getConfig` | `{ offerName }` | Read current delivery / lead-capture config |
| `offer.digital.setMode` | `{ offerName, mode }` | `"paid"` product or `"free"` lead magnet |
| `offer.digital.setCapture` | `{ offerName, ... }` | Free lead-capture copy + consent text |
| `offer.digital.setFormFields` | `{ offerName, fields }` | Replace the entire capture form |
| `offer.digital.addFormField` | `{ offerName, field }` | Add (or replace) one field |
| `offer.digital.removeFormField` | `{ offerName, key }` | Remove a field by key |
| `offer.digital.generateForm` | `{ offerName, prompt }` | AI-generate the capture form from a description |
| `offer.digital.setNurture` | `{ offerName, ... }` | Set/clear the post-delivery nurture CTA |
| `offer.digital.preflight` | `{ offerName }` | Check the offer is ready to launch |

> For a free offer, add the **"Lead Magnet — Capture Form"** section to the **offer** surface (not checkout) — the capture form lives on the sales page, and checkout stays paid-only. Unlike the checkout form, this capture form's fields ARE fully configurable via the `offer.digital.*` commands above.

### Products & deliverables (`offer.product.*`)

The catalog behind offers — what actually gets delivered.

| Command | Params |
|---|---|
| `offer.product.list` / `offer.product.get` | `{ }` / `{ productId }` |
| `offer.product.create` / `offer.product.update` | `{ ... }` / `{ productId, patch }` |
| `offer.product.remove` / `offer.product.restore` | `{ productId }` |
| `offer.product.addDeliverable` / `offer.product.removeDeliverable` | `{ productId, ... }` |
| `offer.product.attachToOffer` / `offer.product.detachFromOffer` | `{ offerName, productId }` |
| `offer.product.listForOffer` | `{ offerName }` |

### Theme

| Command | Params |
|---|---|
| `offer.theme.applyPreset` | `{ offerName, presetId }` — Apollo, Miami, Ivy, Onyx, etc. |
| `offer.theme.setColors` | `{ offerName, primary?, accent?, background?, text? }` |
| `offer.theme.setFont` | `{ offerName, family, weights? }` |
| `offer.theme.setRadius` | `{ offerName, radius }` — px |
| `offer.theme.setMeta` | `{ offerName, title?, description?, ogImage? }` |

### Email & Media

| Command | Params |
|---|---|
| `offer.email.sendTest` | `{ offerName, templateId, to }` |
| `offer.media.upload` | `{ offerName, filePath }` |
| `offer.media.generateImage` | `{ offerName, prompt, ... }` — AI-generate an image asset for the offer |
| `offer.media.list` | `{ offerName }` |
| `offer.media.delete` | `{ offerName, mediaId }` |

### Higher-level AI helpers

| Command | Params | Notes |
|---|---|---|
| `offer.generatePage` | `{ offerName, surface, brief }` | End-to-end page generation from a written brief |
| `offer.rewriteCopy` | `{ offerName, surface, sectionId, tone }` | Rewrite one section in a target tone |
| `offer.suggestPricing` | `{ offerName, context }` | Suggest a base price / bonuses given competitor context |

## Section template library (inspiration / starting points)

`offer.builder.listTemplates { surface }` returns the live catalog. The bundled sections you compose pages from (grouped):

- **Hero** — Centered CTA, Countdown Urgency
- **Content** — Features Icon Grid, Course Curriculum, Comparison Table, feature blurbs
- **Conversion** — Pricing Three Tiers, FAQ Accordion, CTA Final Push, **Lead Magnet — Capture Form**
- **Social proof** — Testimonials Cards, Logo Bar
- **Structure** — Bonus Stack, Minimal Footer

Prefer `offer.builder.applyPagePreset` (whole-page kit) to assemble fast, then `offer.builder.rewriteWithAI` / `updateCode` to tailor each section. Use `offer.builder.listPresets { surface }` to see the full-page kits.

## End-to-end recipes

### A. Ship a polished PAID offer
```
1. offer.create { name: "founder-sprint", title: "Founder Sprint" }
2. offer.digital.setMode { offerName, mode: "paid" }
3. offer.builder.applyPagePreset { offerName, surface: "offer", presetId: "long-form" }
4. offer.theme.applyPreset { offerName, presetId: "apollo" }          # sales-page theme
5. offer.checkout.setBasePrice { offerName, amount: 4999, currency: "INR" }
6. offer.checkout.setGstRate { offerName, rate: 0.18 }
7. offer.checkout.addBonus { offerName, name: "Notion templates", value: 1999 }
8. offer.checkout.addUpsell { offerName, name: "1:1 review call", price: 2999 }
9. offer.style.applyPreset { offerName, presetId: "royal-gold" }      # brands checkout + thank-you
10. offer.checkout.setStyle { offerName, style: { payButtonText: "Join the sprint", defaultPhoneCountry: "IN" } }
11. offer.thankyou.setStyle { offerName, style: { headline: "You're in 🎉", whatsappLink: "https://chat.whatsapp.com/..." } }
12. offer.builder.setPageSettings { offerName, surface: "checkout", patch: { presentationMode: "drawer" } }
13. Verify each surface live (see "Where users see the result").
```

### B. Ship a FREE lead-magnet
```
1. offer.create { name: "swipe-file", title: "50 Hook Swipe File" }
2. offer.digital.setMode { offerName, mode: "free" }
3. offer.builder.applyPagePreset { offerName, surface: "offer", presetId: "minimalist" }
4. offer.builder.add { offerName, surface: "offer", template: "Lead Magnet — Capture Form", position: 2 }
5. offer.digital.generateForm { offerName, prompt: "Name + email + 'what do you struggle with?' dropdown" }
   # or: offer.digital.setFormFields / addFormField for precise control
6. offer.digital.setCapture { offerName, ... }        # headline + consent copy
7. offer.digital.setNurture { offerName, ... }        # post-delivery CTA (e.g. book a call)
8. offer.theme.applyPreset { offerName, presetId: "ivy" }
9. offer.digital.preflight { offerName }              # confirm it's launch-ready
```

## Typical flows

### 1. Build a new offer from a brief
```
1. offer.create { name: "founder-sprint", title: "Founder Sprint" }
2. offer.builder.applyPagePreset { offerName: "founder-sprint", surface: "offer", presetId: "long-form" }
3. offer.checkout.setBasePrice { offerName: "founder-sprint", amount: 4999, currency: "INR" }
4. offer.theme.applyPreset { offerName: "founder-sprint", presetId: "apollo" }
5. offer.builder.rewriteWithAI { offerName, surface: "offer", sectionId: "<heroId>", instruction: "Tighten to 6 words, emphasize speed" }
```

### 2. Add a testimonial section and hook a coupon action
```
1. offer.builder.listTemplates { surface: "offer" }              # find the testimonials template ID
2. offer.builder.add { offerName, surface: "offer", template: "testimonials-3col", position: 4 }
3. offer.builder.listActions { offerName, surface: "checkout" }  # discover applyCoupon action
4. offer.builder.attachAction { offerName, surface: "checkout", sectionId: "<couponId>", actionName: "applyCoupon", target: "submitButton" }
```

### 3. Custom action for a WhatsApp CTA
```
1. offer.builder.createAction {
     offerName, name: "openSalesWhatsApp", label: "Chat with sales",
     body: "window.open('https://wa.me/919XXXXXXXXX?text=' + encodeURIComponent(text), '_blank')",
     params: [{ name: "text", type: "string", required: false, defaultValue: "Hi! I want to know more." }]
   }
2. offer.builder.attachAction { offerName, surface: "offer", sectionId: "<ctaId>", actionName: "openSalesWhatsApp", target: "secondaryButton" }
```

## Error handling

- Every command returns `{ ok: true, result }` on success or `{ ok: false, error: { code, message } }` on failure.
- Common `code` values: `not_found`, `bad_params`, `unauthorized`, `surface_mismatch`, `template_not_found`, `action_conflict`.
- On `surface_mismatch`, re-check `offer.builder.list` — the section belongs to a different surface than you specified.

## Where users see the result

- Offer page: `https://contentlead.in/o/<offerName>`
- Checkout page: `https://contentlead.in/o/<offerName>/checkout` (or a drawer/dialog on the offer page if presentation mode is set)
- Thank-you page: `https://contentlead.in/o/<offerName>/thanks`
- Emails: rendered from the `email` surface + sent via the app's transactional pipeline

## Related skills

- **cl-editor** — the desktop video editor (unrelated command surface, but often used together for CTA promo videos)
- **cl-content-publishing** — publish the promo video that drives traffic to this offer
- **cl-ai-media** — generate hero images / testimonial photos for offer sections
