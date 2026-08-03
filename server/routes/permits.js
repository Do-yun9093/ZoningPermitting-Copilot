// /api/permits — generates the permit / assessment / hearing checklist.
// Crucially, it REUSES the feasibility score and compliance gaps already
// produced (no duplicated logic). The compliance flags tell us which
// permits are extra-required; the feasibility score drives whether we add
// environmental assessments.

const express = require("express");
const { retrieve, formatContext, MUNICIPAL_CODE } = require("../lib/rag");
const { getSession } = require("../lib/session");
const { chat } = require("../lib/groq");

const router = express.Router();

const BASE_PERMITS = [
  {
    name: "Building Permit",
    authority: "Dept. of Building & Safety",
    etaDays: 45,
    trigger: "Any new structure or modification > 120 sq ft"
  },
  {
    name: "Grading Permit",
    authority: "Dept. of Public Works",
    etaDays: 21,
    trigger: "Earthwork > 50 cubic yards"
  },
  {
    name: "Tree Removal Permit",
    authority: "Urban Forestry",
    etaDays: 14,
    trigger: "Any protected-species tree removal"
  }
];

const ASSESSMENTS = [
  {
    name: "Geotechnical Investigation",
    authority: "Private geotech, reviewed by City",
    etaDays: 30,
    trigger: "Seismic Design Category D or higher"
  },
  {
    name: "Floodplain Development Permit",
    authority: "Floodplain Administrator",
    etaDays: 28,
    trigger: "Site lies within the 100-year floodplain"
  },
  {
    name: "Environmental Impact Assessment (CEQA)",
    authority: "Planning Department",
    etaDays: 90,
    trigger: "Threshold of significance likely exceeded"
  }
];

const HEARINGS = [
  {
    name: "Planning Commission Hearing",
    etaDays: 60,
    trigger: "Use permit or major variance required"
  },
  {
    name: "Design Review Board",
    etaDays: 45,
    trigger: "Projects in design-overlay districts"
  }
];

function feasibilityToSet(f) {
  return new Set(f || []);
}

function deriveRequiredPermits({ facts, feasibility, compliance }) {
  const out = [...BASE_PERMITS];
  const feSet = feasibilityToSet(feasibility);

  // Flood-driven extra permit.
  if (feSet.has("flood:high")) {
    const fp = ASSESSMENTS.find((a) => a.name === "Floodplain Development Permit");
    if (fp) out.push({ ...fp, category: "assessment" });
  }
  // Seismic-driven extra.
  if (feSet.has("seismic:high") || feSet.has("seismic:moderate")) {
    const gt = ASSESSMENTS.find((a) => a.name === "Geotechnical Investigation");
    if (gt) out.push({ ...gt, category: "assessment" });
  }
  // Poor transit + large project = likely needs CEQA.
  if (feSet.has("transit:poor") && (facts?.lotArea || "").match(/[5-9]\d{3,}/)) {
    const ceqa = ASSESSMENTS.find((a) => a.name.startsWith("Environmental"));
    if (ceqa) out.push({ ...ceqa, category: "assessment" });
  }
  // Compliance gap that is a "fail" = need a public hearing for variance.
  const hasFail = (compliance?.rows || []).some((r) => r.status === "fail");
  if (hasFail) {
    const hearing = HEARINGS.find((h) => h.name === "Planning Commission Hearing");
    if (hearing) out.push({ ...hearing, category: "hearing" });
  }
  return out;
}

router.post("/", async (req, res) => {
  try {
    const { sessionId, zoneHint } = req.body || {};
    const session = getSession(sessionId);
    const facts = session.extractedFacts;
    const zone = zoneHint || facts.zone || "R-2";

    // We also need the latest compliance result — call it inline if we
    // don't have it. (No duplicated logic: we hit the same RAG corpus.)
    let compliance = req.body?.compliance || null;
    if (!compliance) {
      // Derive a minimal compliance shape from the same code chunks.
      const codeChunks = retrieve(
        `requirements for ${zone}`,
        { topK: 4, zoneHint: zone }
      );
      compliance = {
        zone,
        rows: codeChunks.map((c) => ({
          codeCitation: { id: c.id, zone: c.zone, title: c.title }
        }))
      };
    }

    // Feasibility signals passed in from the frontend's last /feasibility
    // call. Frontend sends it explicitly so the checklist reuses it.
    const feasibilitySignals = req.body?.feasibilitySignals || [];

    const items = deriveRequiredPermits({
      facts,
      feasibility: feasibilitySignals,
      compliance
    });

    // Quick narrative from the LLM (or demo text if no key).
    const prompt = [
      "Write a 2-sentence note for the developer explaining the most important",
      "permits and why they are needed for this project. Be specific. No fluff.",
      "",
      "ZONE: " + zone,
      "FACTS: " + JSON.stringify(facts),
      "FEASIBILITY SIGNALS: " + JSON.stringify(feasibilitySignals),
      "ITEMS: " + JSON.stringify(items.map((i) => i.name))
    ].join("\n");

    const out = await chat({
      system: "You are a permitting officer. Be terse and concrete.",
      user: prompt,
      temperature: 0.1
    });

    const totalEta = items.reduce((sum, i) => sum + (i.etaDays || 0), 0);

    return res.json({
      zone,
      items,
      totalEtaDays: totalEta,
      note: out.text,
      demo: out.demo,
      sessionId: session.id
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[permits] error:", err);
    return res.status(500).json({ error: "permits failed", detail: String(err) });
  }
});

module.exports = router;
