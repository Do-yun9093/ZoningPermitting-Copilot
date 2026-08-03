# Site Feasibility — sample test data

The **Site Feasibility** tab doesn't take a file upload — it works from a
lat/lng (or the address search box, backed by OpenRouteService). Use any
of these to test it:

| Location | Address to search | Lat | Lng | What it's good for testing |
|---|---|---|---|---|
| Sydney (default) | 200 George St, Sydney NSW | -33.8688 | 151.2093 | Default region — should load with no changes. |
| Pyrmont, Sydney | 88 Harris Street, Pyrmont NSW | -33.8697 | 151.1947 | Matches demo case #1 — cross-check Feasibility site against the same address used for Upload/Compliance. |
| Prahran, Melbourne | 214 Chapel Street, Prahran VIC | -37.8496 | 144.9938 | Matches demo case #2 — the floodplain-flagged plan. Good for eyeballing whether the flood score/overlay feels consistent with the doc's own flood note. |
| Brisbane CBD | 45 Adelaide Street, Brisbane QLD | -27.4689 | 153.0235 | Matches demo case #3 (PDF). |
| Perth CBD | 310 Murray Street, Perth WA | -31.9523 | 115.8613 | Matches demo case #4 (image/OCR). |
| Adelaide CBD | 27 Rundle Street, Adelaide SA | -34.9205 | 138.6021 | Matches demo case #5 (image/OCR). |
| Braddon, Canberra | 19 Ainslie Avenue, Braddon ACT | -35.2777 | 149.1367 | Matches demo case #6 (compliance-fail plan). |

## Suggested test flow

1. Leave the tab on its default (Sydney) and click **Run feasibility** —
   confirms the map, scorecard, and nearby parcels render with zero setup.
2. Type one of the addresses above into **Search address** and click
   **Find on map** — confirms OpenRouteService geocoding resolves it and
   recenters the map (or, without an `ORS_API_KEY`, confirms the
   clearly-flagged demo fallback still works).
3. Pick the same city as one of the Upload demo cases (e.g. Melbourne) and
   run feasibility right after uploading that case — lets you sanity-check
   the Feasibility score against the notes already in the uploaded plan.
4. Try an address outside Australia (e.g. "10 Downing Street, London") with
   a real `ORS_API_KEY` set — since geocoding is biased to `boundary.country=AUS`,
   this should return a "no match found" error, which is expected.
