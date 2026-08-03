# Demo cases

Seven files for exercising the **Upload Document**, **Compliance Gap**,
and **Feasibility** tabs. All are set in Australia, matching the default
region used by the Feasibility map.

| # | File | Type | What it demonstrates |
|---|------|------|-----------------------|
| 1 | `01-site-plan-sydney.txt` | Plain text | Clean, fully-extractable site plan — Pyrmont, Sydney NSW. Every field (zone, setbacks, height, FAR, lot area, parking, lat/lng) parses successfully. Zone R-2, and every value is within code — expect all-PASS rows in Compliance Gap (parking will show "unclear" — see note below). |
| 2 | `02-site-plan-melbourne-floodplain.txt` | Plain text | Same clean extraction, but the notes flag the site as **inside** a 1-in-100-year floodplain overlay — useful for eyeballing against the Feasibility flood score for the same coordinates. |
| 3 | `03-site-plan-brisbane.pdf` | PDF (text-based) | A real, generated PDF. Confirms the parser's PDF text-extraction path — every field extracts (zone, FAR, height, setback, parking, lat/lng). |
| 4 | `04-site-diagram-perth.png` | Image | A site-diagram-style image. The server OCRs it (via `tesseract.js`) on upload, so most fields (front/rear setback, zoning, lat/lng) extract automatically; side setback is left out by design to show a realistic partial-OCR result. |
| 5 | `05-council-letter-adelaide-scan.jpg` | Image (simulated scan) | A photographed-looking council letter. Same OCR path as #4, cleaner source text — front setback, height, FAR, zone, and lat/lng all extract. |
| 6 | `06-compliance-fail-canberra.txt` | Plain text | **Built to fail.** Zone R-2, but FAR (1.8 vs. cap 1.2), height (40 ft vs. cap 35 ft), and front setback (8 ft vs. minimum 15 ft) are all out of code — use this to see real **FAIL** rows in Compliance Gap, not just PASS. |
| 7 | `feasibility-sample-data.md` | Reference (not an upload) | A table of matching addresses/coordinates for the **Feasibility** tab, since that tab works from lat/lng or address search rather than a file upload. |

## Notes on parsing behavior

- **PDFs**: the parser does a raw-byte text scan (no PDF-library
  decompression), so if you generate your own test PDF, make sure it's
  saved **without stream compression** (e.g. `reportlab`'s
  `Canvas(..., pageCompression=0)`) or export from a tool that doesn't
  compress text streams — otherwise the parser finds no readable text.
  Also keep each fact (label + value) on **one line** — a PDF renders each
  line as a separate draw command, and a fact split across two lines will
  have PDF coordinate numbers between them that break the parser's regex.
- **Images**: uploads now run through OCR (`tesseract.js`) automatically —
  no manual step needed. OCR quality depends on the source image, so
  expect the occasional missed or slightly garbled field on a real,
  imperfect scan; that's realistic, not a bug. If `tesseract.js` fails to
  load or OCR errors out for any reason, the app falls back to the old
  "no structured facts could be extracted" message instead of crashing.
- **Parking**: the Compliance Gap tab always marks parking `unclear`
  regardless of the document (see `server/routes/compliance.js` —
  it's intentionally honest rather than guessing a required ratio from
  unit count). This isn't a parsing failure — it's a scope choice.

## Suggested test flow

1. Upload **#1** → confirm the extracted-facts panel is fully populated →
   switch to **Compliance Gap** → expect all **PASS** (parking: unclear).
2. Upload **#6** → same tabs → expect **FAIL** on FAR, height, and front
   setback, with a clear explanation in the summary.
3. Upload **#3** (PDF) → confirms PDF parsing works, not just `.txt`.
4. Upload **#4** or **#5** (images) → confirms OCR actually extracts
   facts from an image now, rather than just showing a fallback message.
5. Open **Site Feasibility**, use `feasibility-sample-data.md` to search
   an address (or just click **Run feasibility** on the Sydney default)
   and confirm the map recenters and plots the site + nearby parcels.
6. Check **Permit Checklist** after any of the above — it should reuse
   the same session facts + feasibility/compliance results.
