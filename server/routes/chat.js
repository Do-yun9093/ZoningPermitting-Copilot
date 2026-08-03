// /api/chat — answers questions grounded in BOTH the municipal-code RAG and
// (optionally) the session's uploaded document.

const express = require("express");
const { chat } = require("../lib/groq");
const { retrieve, formatContext } = require("../lib/rag");
const { getSession, appendHistory } = require("../lib/session");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, sessionId, zoneHint } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const session = getSession(sessionId);

    // 1. RAG over municipal code.
    const codeChunks = retrieve(message, { topK: 3, zoneHint });
    const codeContext = formatContext(codeChunks);

    // 2. Pull the session's uploaded doc (if any).
    const facts = session.extractedFacts;
    const hasUpload = Boolean(session.rawText || Object.keys(facts).length);

    const uploadSection = hasUpload
      ? [
          "UPLOADED DOCUMENT — EXTRACTED FACTS:",
          JSON.stringify(facts, null, 2),
          "\nUPLOADED DOCUMENT — RAW TEXT (excerpt):",
          session.rawText
            ? session.rawText.slice(0, 4000)
            : "(no readable text — likely an image; rely on EXTRACTED FACTS only)"
        ].join("\n")
      : ["UPLOADED DOCUMENT: (none uploaded this session)"].join("\n");

    const system = [
      "You are a Zoning & Permitting Copilot for real estate developers.",
      "Answer strictly from the MUNICIPAL CODE and UPLOADED DOCUMENT below.",
      "Cite the code section you used in square brackets using the bracketed ids (e.g. [1], [2]).",
      "If the uploaded document does not contain enough information to answer, say 'UNCLEAR — insufficient data in the uploaded document' rather than guessing.",
      "Be concise. Use plain language."
    ].join(" ");

    const user = [
      "MUNICIPAL CODE (retrieved):",
      codeContext,
      "",
      uploadSection,
      "",
      `USER QUESTION: ${message}`
    ].join("\n");

    const out = await chat({ system, user, temperature: 0.2 });

    appendHistory(session.id, "user", message);
    appendHistory(session.id, "assistant", out.text, codeChunks.map((c) => c.id));

    return res.json({
      answer: out.text,
      demo: out.demo,
      citations: codeChunks.map((c, i) => ({
        index: i + 1,
        id: c.id,
        zone: c.zone,
        title: c.title
      })),
      sessionId: session.id,
      usedUpload: hasUpload
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[chat] error:", err);
    return res.status(500).json({ error: "chat failed", detail: String(err) });
  }
});

module.exports = router;
