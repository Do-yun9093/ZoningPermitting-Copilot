# Zoning & Permitting Copilot — Prototype

A prototype copilot for real estate developers and urban planners. It answers
zoning questions, evaluates site feasibility, generates permit checklists, and
lets the chatbot answer questions grounded in any document you upload.

**Stack**

- Frontend: React + Vite + Tailwind CSS (light theme: yellow · white · orange)
- Backend: Node.js + Express
- LLM: Groq (`openai/gpt-oss-120b` by default) — OpenAI-compatible endpoint
- Retrieval: RAG over a sample municipal-code corpus
- Map: Leaflet + OpenStreetMap tiles, with address search via the
  [OpenRouteService](https://openrouteservice.org) geocoding API
  (default region: Australia)

---

## Features

1. **Zoning RAG Chat** — natural-language Q&A grounded in municipal-code chunks.
2. **Upload-Grounded Document Chat** — chat directly with an uploaded PDF / image / text file; every answer cites the chunk it came from.
3. **Site Feasibility Reporter** — submit GPS + project dimensions (or search an address), get a flood / seismic / transit scorecard plotted on a real, interactive map with a risk overlay and nearby comparable-zoning parcels. Defaults to Sydney, Australia.
4. **Zoning Compliance Gap Report** — auto-generated side-by-side table of code requirements vs. uploaded plan values, with pass / fail / unclear flags.
5. **Permit Application Checklist** — generates required permits, environmental assessments, public hearings, and ETA — reusing feasibility + compliance signals (no duplicated logic).
6. **Snowflake Demo Experience** — a new Snowflake-centered showcase page that explains why Snowflake is a strong fit for analytics-driven planning workflows and demonstrates a dynamic demo case with cocoCLI guidance.

---

## Run locally — 2 commands

The root `package.json` uses npm workspaces, so from the project root:

```bash
npm install     # installs root + client + server deps, auto-creates server/.env
npm run dev     # starts server (8787) + client (5173) in one terminal
```

Then open <http://localhost:5173>.

On the first `npm install`, a `postinstall` hook copies `server/.env.example`
→ `server/.env` for you. Paste your Groq key into that file:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

Get a free Groq key at <https://console.groq.com/keys>. If you skip it, the
backend still works — it returns clearly-flagged "demo" responses so the
UI is walkable for design reviews.

### Map / address search (OpenRouteService)

The **Feasibility** tab's map is a real Leaflet map (OpenStreetMap tiles —
no key needed for the tiles themselves). The address-search box, however,
calls `/api/geocode`, which is backed by the
[OpenRouteService](https://openrouteservice.org) geocoding API and is
biased to **Australia** by default:

```
ORS_API_KEY=replace_with_your_openrouteservice_api_key
ORS_COUNTRY=AUS
```

Get a free key at <https://openrouteservice.org/dev/#/signup> (no card
required) and paste it into `server/.env`. Without a key, address search
still works — it returns a clearly-flagged demo coordinate (Sydney) so the
map stays walkable. The default site coordinates on first load are also
Sydney, NSW (`-33.8688, 151.2093`); change `ORS_COUNTRY` and the defaults
in `client/src/components/FeasibilityPanel.jsx` to target a different
region.

The Vite dev server proxies `/api/*` to `http://localhost:8787`
(see `client/vite.config.js`). Both processes stream logs into your
terminal, prefixed `server` (yellow) and `client` (magenta).

### Useful sub-commands

```bash
npm run dev:server   # server only
npm run dev:client   # client only
npm run build        # production build of the React app (client/dist)
```

---

## Deploy to Vercel

You have two options. Pick the one that matches your needs.

### Option A — One project, monorepo (recommended for the prototype)

This repo is already wired for a single Vercel project:

1. Push the folder to a new GitHub repo.
2. Go to <https://vercel.com/new> and import the repo.
3. Vercel auto-detects the `vercel.json` at the root:
   - The Express app is mounted under `/api/*` as serverless functions
     (see `api/index.js`).
   - The `client/` Vite app is built and served from `/`.
4. Add an environment variable in **Project Settings → Environment Variables**:
   - `GROQ_API_KEY` = your key
   - `GROQ_MODEL` = `openai/gpt-oss-120b` (optional, this is the default)
5. Click **Deploy**. Vercel gives you a URL like
   `https://zoning-copilot.vercel.app`. The frontend talks to
   `/api/*` on the same origin — no CORS, no extra config.

Notes on the monorepo setup:

- The Express app lives in `server/` for local dev (`npm run dev`).
- For Vercel, `api/index.js` re-exports the same Express app so every
  request to `/api/*` runs as a serverless function. Static file uploads
  in production are in-memory only (the prototype); for production-grade
  storage, swap in S3 or Vercel Blob.
- The frontend uses `import.meta.env.VITE_API_BASE` if set; otherwise it
  defaults to a relative `/api` (same-origin in production, proxied in
  dev).

### Option B — Split deploy (frontend on Vercel, backend on Railway / Render)

If you want a long-running Node server with persistent file storage:

1. Deploy `server/` to Railway or Render as a Node service.
   - Build command: `npm install`
   - Start command: `npm start`
   - Env: `GROQ_API_KEY`, `PORT`
2. Deploy `client/` to Vercel.
   - Root directory: `client`
   - Build command: `npm run build`
   - Output dir: `dist`
   - Env: `VITE_API_BASE` = your backend URL, e.g.
     `https://zoning-copilot-api.up.railway.app`
3. In the backend service, set CORS to allow your Vercel domain (the
   server already includes permissive CORS for prototype use).

---

## Project layout

```
zoning-copilot/
├── api/
│   └── index.js              # Vercel serverless entry — wraps the Express app
├── client/                   # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/       # Chat, Upload, Feasibility, Compliance, Permits, SiteMap
│   │   └── lib/api.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                   # Express app (local dev)
│   ├── index.js
│   ├── data/municipalCode.js # sample code corpus for RAG
│   ├── lib/                  # Groq client, RAG, parsers
│   └── routes/               # chat, upload, feasibility, compliance, permits, geocode
├── demo-cases/                # sample docs (txt/pdf/images) + feasibility test data
├── vercel.json                # monorepo build config
└── README.md
```

---

## Snowflake + cocoCLI

A new Snowflake experience is now available in the app. It is designed as a lightweight analytics showcase for teams who want to explain a modern data workflow without leaving the product UI.

- Snowflake is presented as a strong fit for governed analytics, shared forecasting, and SQL-first reporting.
- cocoCLI is introduced as a simple command-line companion for running a repeatable demo workflow.
- The Snowflake page loads a dynamic demo case from demo-cases/snowflake-demo-case.json so the content can evolve without changing the UI.

To explore it locally, run the app and open the new Snowflake Demo entry in the sidebar.

## Try it with sample documents

A sample site plan lives at `client/public/sample-site-plan.txt` (also
served at `/sample-site-plan.txt` in dev). Drop it into the **Upload
Document** tab — the parser will pull out front setback, height, FAR,
parking count, zone, and lat/lng, and ground every other tab in those
facts.

For broader testing, `demo-cases/` at the project root has additional
Australian sample documents — plain text, a real `.pdf`, two images (now
OCR'd automatically on upload via `tesseract.js`), a document intentionally
built to fail Compliance Gap checks, and a reference table of
addresses/coordinates for the Feasibility tab. See `demo-cases/README.md`
for the full breakdown and a suggested test flow.

## Notes on the prototype

- The municipal code corpus in `server/data/municipalCode.js` is a small
  sample. Drop in your own code book and the RAG engine reuses it as-is.
- LLM calls default to Groq (`openai/gpt-oss-120b`) and are centralised in
  `server/lib/groq.js` so every feature shares one client.
- If a Groq key isn't set, the backend returns clearly-flagged "demo"
  responses so the UI is still walkable for design reviews.
- Same pattern for the map: if `ORS_API_KEY` isn't set, `/api/geocode`
  returns a clearly-flagged demo coordinate (Sydney) instead of erroring,
  so the Feasibility map stays walkable without any setup.
- Uploaded files in production (Vercel) live in memory only — the next
  request may not see them. This is intentional for a prototype.
- Image uploads (PNG/JPG) run through OCR (`tesseract.js`) before fact
  extraction, so a photographed or scanned document can populate the
  same fields as a `.txt`/`.pdf` upload. OCR quality depends on the
  source image; if it fails for any reason, the app falls back to the
  original "no structured facts could be extracted" message rather than
  erroring.
