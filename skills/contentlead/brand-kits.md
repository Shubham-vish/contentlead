---
name: brand-kits
description: List, create, update, delete, and apply Brand Kits; apply saved colors/fonts; upload/list/delete brand assets; and place logos or watermarks on the editor canvas.
---

# Brand Kits

Brand commands operate on the authenticated user's same Cosmos-backed Brand Kits used by the editor panel. They reuse the panel's item-aware color mapping, font resolver, one-step apply plan, WCAG contrast warnings, and watermark placement rules.

## Kit CRUD

```json
{"type":"brand.listKits","params":{}}
{"type":"brand.getKit","params":{"kitId":"kit-id"}}
{"type":"brand.createKit","params":{
  "name":"Acme",
  "colors":["#6D28D9","#FFFFFF"],
  "fonts":["Inter"],
  "primaryColor":"#6D28D9",
  "primaryFont":"Inter"
}}
{"type":"brand.updateKit","params":{
  "kitId":"kit-id",
  "colors":["#6D28D9","#FFFFFF","#111827"],
  "primaryColor":"#6D28D9",
  "etag":"etag-from-get"
}}
{"type":"brand.deleteKit","params":{"kitId":"kit-id"}}
```

Use the latest `etag` for concurrent-safe updates. A primary color/font must exist in the corresponding list.

## Apply a complete kit

```json
{"type":"brand.apply","params":{
  "kitId":"kit-id",
  "itemIds":["title-1","caption-1","shape-1"]
}}
```

If `itemIds` is omitted, current selection is used. The command:
- maps primary color to the correct per-item field
- applies the primary font only to text/caption items
- loads the matching font URL when available
- dispatches one undoable edit
- returns `colorApplied`, `fontApplied`, `skipped`, and `contrastWarnings`

## Apply one color or font

```json
{"type":"brand.applyColor","params":{"color":"#6D28D9","itemIds":["title-1","shape-1"]}}
{"type":"brand.applyFont","params":{"font":"Inter","itemIds":["title-1","caption-1"]}}
```

## Assets

```json
{"type":"brand.listAssets","params":{"kitId":"kit-id"}}
{"type":"brand.uploadAsset","params":{
  "kitId":"kit-id",
  "sourceUrl":"data:image/png;base64,...",
  "kind":"logo",
  "name":"Acme logo"
}}
{"type":"brand.deleteAsset","params":{"kitId":"kit-id","assetId":"asset-id"}}
```

`sourceUrl` must be fetchable in the editor renderer. Data URLs and same-origin/accessible HTTPS images work.

Place an asset:

```json
{"type":"brand.addAssetToCanvas","params":{
  "kitId":"kit-id",
  "assetId":"asset-id",
  "from":0,
  "durationMs":10000
}}
```

Logos and watermarks default to the top-right 5% safe area and 18% canvas width, preserving known asset aspect ratio. Graphics use normal image placement. Explicit `x`, `y`, `width`, and `height` override automatic placement.

## Rules

- Call `brand.listKits` before guessing kit ids.
- Prefer `brand.apply` over manually editing each item.
- Treat `contrastWarnings` as actionable; do not claim brand application is complete without reporting/fixing low contrast.
- Reorder tracks if a newly placed watermark needs a different z-order.
