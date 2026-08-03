const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/demo", (_req, res) => {
  try {
    const demoCasePath = path.join(__dirname, "..", "..", "demo-cases", "snowflake-demo-case.json");
    const raw = fs.readFileSync(demoCasePath, "utf8");
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: "snowflake demo case unavailable", detail: String(err) });
  }
});

module.exports = router;
