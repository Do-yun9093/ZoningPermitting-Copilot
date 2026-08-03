// Express entry — runs in dev (node index.js) and is re-exported for Vercel
// serverless via api/index.js.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const chatRoutes = require("./routes/chat");
const uploadRoutes = require("./routes/upload");
const feasibilityRoutes = require("./routes/feasibility");
const complianceRoutes = require("./routes/compliance");
const permitsRoutes = require("./routes/permits");
const geocodeRoutes = require("./routes/geocode");
const snowflakeRoutes = require("./routes/snowflake");

const { isLive } = require("./lib/groq");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Tiny request log so it's clear what's flowing through.
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    groqLive: isLive(),
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b"
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/feasibility", feasibilityRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/permits", permitsRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/snowflake", snowflakeRoutes);

// 404 for any unknown /api/* — keeps the frontend errors readable.
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

if (require.main === module) {
  const port = process.env.PORT || 8787;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`zoning-copilot API on http://localhost:${port}  (groqLive=${isLive()})`);
  });
}

module.exports = { app };
