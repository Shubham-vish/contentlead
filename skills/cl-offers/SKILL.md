---
name: cl-offers
description: Build, edit, and manage ContentLead Offer Studio surfaces (offer sales pages, checkout pages, thank-you pages, and email templates) from any AI agent. Use for creating offers, adding/removing/rearranging sections, editing copy, swapping templates, applying page presets, wiring buyer actions (call CTA, validate phone/email, apply coupon), configuring checkout (base price, GST, bonuses, upsells, order bumps), managing coupons, and applying theme presets. Covers all four surfaces via a single command surface exposed at `/api/offer-studio/commands/<name>`.
---

# ContentLead Offers — AI Agent Skill

Control the ContentLead **Offer Studio** — the builder that ships full sales pages, checkout, thank-you, and buyer emails for any digital offer — from any AI agent.

Unlike `cl-editor` (which talks to the desktop app), Offer Studio runs in the ContentLead web app at `contentlead.in`. Commands go to the user's authenticated session, not a local port.

## 🚨 Startup protocol

The user must be:
1. Signed in to `https://contentlead.in` in a browser, AND
2. Have at least one offer created (or explicitly ask you to create one via `offer.create`).

You do NOT read `~/.skilltown-desktop/api.json` for this skill. There is no local port. Commands target the user's session directly through the ContentLead app (agents integrated via the desktop bridge auto-pass session cookies).

**First discovery call:**
```bash
POST /api/offer-studio/commands/offer.list
# → returns every offer the user owns with names, surfaces, and last-edited times
```

Pick a target `offerName` before touching any of the surface commands below.

## Command surface — one endpoint, ~55 commands

Every command is called the same way:

```bash
POST /api/offer-studio/commands/<commandName>
Content-Type: application/json
{ "params": { ... } }
```

Or via the higher-level AI runner (which asks the model to plan and then dispatches):

```bash
POST /api/offer-studio/ai
{ "prompt": "Add a testimonials section to the offer 'weekend-course' and swap the hero template" }
```

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

### Coupons

| Command | Params |
|---|---|
| `offer.coupon.create` | `{ offerName, code, discountPercent?, discountAmount?, expiresAt? }` |
| `offer.coupon.update` | `{ offerName, code, patch }` |
| `offer.coupon.delete` | `{ offerName, code }` |
| `offer.coupon.expire` | `{ offerName, code }` |

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
| `offer.media.list` | `{ offerName }` |
| `offer.media.delete` | `{ offerName, mediaId }` |

### Higher-level AI helpers

| Command | Params | Notes |
|---|---|---|
| `offer.generatePage` | `{ offerName, surface, brief }` | End-to-end page generation from a written brief |
| `offer.rewriteCopy` | `{ offerName, surface, sectionId, tone }` | Rewrite one section in a target tone |
| `offer.suggestPricing` | `{ offerName, context }` | Suggest a base price / bonuses given competitor context |

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
