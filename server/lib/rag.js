// Tiny RAG engine over the municipal code corpus.
// Scores by keyword overlap — fine for a prototype. Swap for embeddings + a
// vector DB in production.

const { MUNICIPAL_CODE } = require("../data/municipalCode");

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreChunk(query, chunk) {
  const qTokens = new Set(tokenize(query));
  const cTokens = tokenize(chunk.title + " " + chunk.body + " " + chunk.zone);
  if (cTokens.length === 0) return 0;
  let hits = 0;
  for (const t of cTokens) if (qTokens.has(t)) hits += 1;
  // Zone field is a strong prior — boost if query mentions a zone.
  if (qTokens.has(chunk.zone.toLowerCase())) hits += 3;
  return hits;
}

/**
 * retrieve(query, { topK, zoneHint })
 * Returns the top-K most relevant code chunks, with their ids and bodies.
 */
function retrieve(query, { topK = 3, zoneHint = null } = {}) {
  let pool = MUNICIPAL_CODE;
  if (zoneHint) {
    const filtered = pool.filter(
      (c) => c.zone === zoneHint || c.zone === "ALL"
    );
    pool = filtered.length ? filtered : pool;
  }
  const ranked = pool
    .map((c) => ({ chunk: c, score: scoreChunk(query, c) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.chunk);

  // Fall back to the first `topK` chunks if nothing matched.
  return ranked.length ? ranked : pool.slice(0, topK);
}

/**
 * formatContext(chunks) — turn chunks into a numbered context block the LLM
 * can cite as [1], [2], [3]…
 */
function formatContext(chunks) {
  return chunks
    .map((c, i) => `[${i + 1}] (id=${c.id}, zone=${c.zone}) ${c.title}\n${c.body}`)
    .join("\n\n");
}

module.exports = { retrieve, formatContext, MUNICIPAL_CODE };
