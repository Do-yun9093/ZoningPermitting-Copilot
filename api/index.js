// Vercel serverless entry: re-export the Express app so every /api/* request
// runs through the same routes as local dev.
//
// In dev:   cd server && npm run dev
// In prod:  Vercel routes /api/* here.

const { app } = require("../server/index.js");
module.exports = app;
