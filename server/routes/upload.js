// /api/upload — accepts a PDF / image / text file, parses it, and stores
// the extracted facts as the active session context for the chatbot.

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { readText, extractFacts } = require("../lib/parser");
const { setFacts } = require("../lib/session");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const stamp = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${stamp}_${safe}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const text = await readText(req.file.path, req.file.mimetype);
    const facts = extractFacts(text);

    const { sessionId } = req.body || {};
    const session = setFacts(sessionId, facts, text);

    return res.json({
      sessionId: session.id,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      extractedFacts: session.extractedFacts,
      preview: (session.rawText || "").slice(0, 800),
      unclearFields: Object.keys(session.extractedFacts).length === 0
        ? ["no structured facts could be extracted — try a text-based PDF or .txt"]
        : []
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[upload] error:", err);
    return res.status(500).json({ error: "upload failed", detail: String(err) });
  }
});

module.exports = router;
