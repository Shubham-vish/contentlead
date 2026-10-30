# Native board artifacts and spreadsheet imports

These are source-defined, capability-gated additions. An installed Desktop
catalog entry and actual mounted board support are both required. Do not treat
these docs or a source test as runtime acceptance.

Every `/api/execute` request needs the explicit board `tabId` and
`params.expectedBoardId` (or matching `expectedContentId`). Check
`board.query.info` and `board.query.commands` first. Do not navigate or edit the
board/selection while an export is running. Unknown commands are an installation
gap, not permission to substitute a screenshot for an editable/vector artifact.

## SVG, PDF and editable PPTX

`board.exportSvg`, `board.exportPdf`, `board.exportPptx` accept no additional
params. They call the mounted native export-panel callbacks and return:

```json
{"boardId":"...","fileName":"...","mimeType":"...","base64":"...","byteLength":123,"warnings":[]}
```

Base64 is raw, without a data-URL prefix. Decode it to the intended local file
and check the MIME/size/warnings; no print dialog or automatic file download is
used by the command. Empty artifacts and artifacts above 24 MiB fail.
No export mutates timeline or board history.

- **SVG:** `image/svg+xml`. Native basic vectors/text/images; unsupported
  objects/connectors/HTML/docs/mermaid/video may be omitted and image references
  may remain external. This is not a universal lossless/self-contained export.
- **PDF:** `application/pdf`. A genuine PDF embedding the **same native
  html2canvas PNG capture** used by the print UI. Raster/current canvas, not
  editable vector PDF or a guarantee that every offscreen canvas object was
  captured. It returns bytes rather than opening print/save.
- **PPTX:** standard presentation MIME. Uses the existing native editable
  object converter and PPTX serializer, not slide screenshots. Text and
  supported objects remain editable. Native placeholders/omissions remain;
  inspect warnings including per-object conversion failures before delivery.

## Animated GIF jobs

1. `board.exportGif.start` with optional `fps` integer 5–30 (default 15),
   `duration` seconds 1–20 (default 3), `quality` integer 1–4 (default 2).
   Maximum 300 frames; Ultra (`quality:4`) is limited to four seconds.
   The native exporter may reject additional quality/object/area limits:
   command mode fails rather than silently accepting a UI downgrade.
2. Poll `board.exportGif.status {jobId}`. Inspect `status`, `phase`,
   `progress`. Only `status:"completed"` includes `artifact` with actual
   native GIF bytes and the artifact fields above.
3. `board.exportGif.cancel {jobId}` requests cooperative cancellation.
   `cancelling` is not terminal: poll until `cancelled`/`failed`/`completed`.
   Encoding stops at a native progress checkpoint; it is not immediate CPU
   interruption. Board/object/selection changes fail the export.

One active job is allowed per mounted renderer. The last terminal job/artifact
is discarded on the next start. Do not start a duplicate job after a timeout;
inspect its returned ID/state. Exporter/capture dependencies must already be
available; tests do not establish native browser animation fidelity.

## XLSX, XLS and CSV sheet selection

1. `board.importSpreadsheet.prepare`:
   `{fileName:"table.xlsx",fileBase64:"<standard-base64>"}`.
   Supports `.xlsx`, `.xls`, `.csv`, decoded input ≤4 MiB, ≤30 sheets,
   native ≤100,000 cells per sheet. Returns `importId`, `sheets` with exact
   names/dimensions and `renderedRowLimit:500`, `expiresInSeconds:600`.
2. Review the manifest and call `board.importSpreadsheet.apply` with:
   `{importId,sheetNames:["Exact name"],x:0,y:0,scale:1,columns:1}`.
   Select 1–30 distinct existing names; finite x/y; scale 0.1–3; columns 1–10.
   The command reuses the **same UI planner**, styled/merged HTML tables and
   frame arrangement. Native rendering caps each sheet at 500 rows; this is
   not a full spreadsheet/calculation engine and formulas are not evaluated.
3. Inspect returned object IDs, undo if necessary, then `board.save`.
   Apply consumes the prepared import and creates one native history entry.
   Its `stateScope:"unsaved-board"` is not a durable save receipt.
4. `board.importSpreadsheet.discard {importId}` releases an unused preparation.

Preparations are mounted-board scoped, expire after ten minutes, and are
limited to four per renderer. Stale/foreign IDs and unknown sheet selections
fail without insertion. After an uncertain apply inspect the canvas before
repeating. Editable **PPTX import remains unsupported by this command**;
do not replace it with PDF or screenshot import and call that equivalent.
