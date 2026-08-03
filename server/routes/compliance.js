// /api/compliance — auto-generates a side-by-side table comparing the
// uploaded plan's extracted facts against the relevant code requirements.
// Reuses the same RAG engine + extracted facts — no duplicated logic.

const express = require("express");
const { retrieve, formatContext, MUNICIPAL_CODE } = require("../lib/rag");
const { getSession } = require("../lib/session");
const { chat } = require("../lib/groq");

const router = express.Router();

// Maps a code chunk id to the field name we expect in the extracted facts.
const REQUIREMENT_FIELDS = [
  { id: "FAR-R2", field: "far", label: "Floor Area Ratio", code: "R-2" },
  { id: "FAR-C1", field: "far", label: "Floor Area Ratio", code: "C-1" },
  { id: "HEIGHT-R2", field: "height", label: "Height limit", code: "R-2" },
  { id: "HEIGHT-C1", field: "height", label: "Height limit", code: "C-1" },
  { id: "SETBACK-R2", field: "frontSetback", label: "Front setback", code: "R-2" },
  { id: "SETBACK-C1", field: "frontSetback", label: "Front setback", code: "C-1" },
  { id: "PARKING-R2", field: "parkingSpaces", label: "Parking spaces", code: "R-2" },
  { id: "PARKING-C1", field: "parkingSpaces", label: "Parking spaces", code: "C-1" }
];

function findRequirement(code, field) {
  return REQUIREMENT_FIELDS.find((r) => r.code === code && r.field === field);
}

function evaluateValue(fieldKey, value, codeBody) {
  // Very small rule evaluator. Returns "pass" / "fail" / "unclear".
  if (value == null || value === "") return "unclear";
  const str = String(value).toLowerCase();

  if (fieldKey === "far") {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return "unclear";
    if (codeBody.includes("maximum floor area ratio") && codeBody.match(/([0-9.]+)/)) {
      // Best-effort: pull the first numeric in the body as the cap.
      const cap = parseFloat(codeBody.match(/([0-9.]+)/)[1]);
      return num <= cap ? "pass" : "fail";
    }
    return "unclear";
  }

  if (fieldKey === "height") {
    const m = str.match(/([0-9.]+)\s*ft/);
    if (!m) return "unclear";
    const ft = parseFloat(m[1]);
    const capMatch = codeBody.match(/(?:exceed|may not exceed)\s*([0-9.]+)\s*feet/);
    if (!capMatch) return "unclear";
    const cap = parseFloat(capMatch[1]);
    return ft <= cap ? "pass" : "fail";
  }

  if (fieldKey === "frontSetback") {
    const m = str.match(/([0-9.]+)\s*ft/);
    if (!m) return "unclear";
    const ft = parseFloat(m[1]);
    // "Front yard setback: N feet minimum"
    const capMatch = codeBody.match(/front\s*yard\s*setback:\s*([0-9.]+)\s*feet/i)
      || codeBody.match(/no\s*minimum\s*front\s*setback/i);
    if (capMatch && /no minimum/i.test(capMatch[0])) return "pass";
    if (!capMatch) return "unclear";
    const min = parseFloat(capMatch[1]);
    return ft >= min ? "pass" : "fail";
  }

  if (fieldKey === "parkingSpaces") {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return "unclear";
    // Use the feasibility result to know the unit count if we can derive it.
    // For the prototype we mark this "unclear" unless the doc also gave us
    // a unit count — better to be honest than to guess.
    return "unclear";
  }

  return "unclear";
}

router.post("/", async (req, res) => {
  try {
    const { sessionId, zoneHint } = req.body || {};
    const session = getSession(sessionId);
    const facts = session.extractedFacts;
    const zone = zoneHint || facts.zone || "R-2";

    // Pick requirements for the active zone.
    const applicable = REQUIREMENT_FIELDS.filter((r) => r.code === zone);
    const rows = [];

    for (const req of applicable) {
      const codeChunk = MUNICIPAL_CODE.find((c) => c.id === req.id);
      if (!codeChunk) continue;
      const value = facts[req.field];
      const status = evaluateValue(req.field, value, codeChunk.body);
      rows.push({
        requirement: req.label,
        codeCitation: { id: codeChunk.id, zone: codeChunk.zone, title: codeChunk.title },
        required: extractRequired(codeChunk.body, req.field),
        proposed: value == null ? "—" : String(value),
        status
      });
    }

    // Have the LLM write a short summary line.
    const summaryPrompt = [
      "Summarize the following compliance gaps in 1-2 sentences for a real",
      "estate developer. Be specific. Do not invent numbers.",
      "",
      "ZONE: " + zone,
      "FACTS: " + JSON.stringify(facts),
      "ROWS: " + JSON.stringify(rows)
    ].join("\n");

    const out = await chat({
      system: "You are a zoning compliance summarizer. Be concise and specific.",
      user: summaryPrompt,
      temperature: 0.1
    });

    return res.json({
      zone,
      rows,
      summary: out.text,
      demo: out.demo,
      sessionId: session.id
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[compliance] error:", err);
    return res.status(500).json({ error: "compliance failed", detail: String(err) });
  }
});

function extractRequired(body, field) {
  if (field === "far") {
    const m = body.match(/([0-9.]+)/);
    return m ? `≤ ${m[1]}` : "see code";
  }
  if (field === "height") {
    const m = body.match(/(?:exceed|may not exceed)\s*([0-9.]+)\s*feet/);
    return m ? `≤ ${m[1]} ft` : "see code";
  }
  if (field === "frontSetback") {
    const m = body.match(/front\s*yard\s*setback:\s*([0-9.]+)\s*feet/i);
    return m ? `≥ ${m[1]} ft` : "see code";
  }
  if (field === "parkingSpaces") {
    return "see code";
  }
  return "see code";
}

module.exports = router;
