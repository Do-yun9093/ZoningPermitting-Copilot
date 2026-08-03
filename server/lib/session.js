// In-memory session store for the prototype. Each session has:
//   - extractedFacts: the structured facts pulled from the uploaded doc
//   - rawText: the parsed text of the upload (truncated to a cap)
//   - history: chat turns
//   - feasibility: cached feasibility result so compliance & permits can reuse it
//
// In production, swap for Redis / a real DB. In Vercel serverless, this is
// per-instance and request-to-request visibility is best-effort.

const sessions = new Map();

const MAX_TEXT_CHARS = 24_000;

function createSession() {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session = {
    id,
    extractedFacts: {},
    rawText: "",
    history: [],
    feasibility: null,
    createdAt: new Date().toISOString()
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  if (!id) return createSession();
  let s = sessions.get(id);
  if (!s) {
    s = createSession();
    sessions.set(id, s);
  }
  return s;
}

function setFacts(id, facts, rawText) {
  const s = getSession(id);
  s.extractedFacts = { ...s.extractedFacts, ...facts };
  if (rawText) {
    s.rawText = rawText.length > MAX_TEXT_CHARS
      ? rawText.slice(0, MAX_TEXT_CHARS) + "\n\n[truncated]"
      : rawText;
  }
  return s;
}

function appendHistory(id, role, content, citations = []) {
  const s = getSession(id);
  s.history.push({ role, content, citations, at: new Date().toISOString() });
  return s;
}

function setFeasibility(id, result) {
  const s = getSession(id);
  s.feasibility = result;
  return s;
}

module.exports = {
  createSession,
  getSession,
  setFacts,
  appendHistory,
  setFeasibility
};
