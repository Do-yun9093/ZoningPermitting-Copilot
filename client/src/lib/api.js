// API client. In dev, Vite proxies /api/* to http://localhost:8787.
// In production (Vercel), the same path is served by the serverless function.

const BASE = import.meta.env.VITE_API_BASE || "/api";

async function http(path, { method = "GET", body, isForm = false } = {}) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || ""; } catch {}
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  return res.json();
}

export const api = {
  health: () => http("/health"),
  chat: (payload) => http("/chat", { method: "POST", body: payload }),
  upload: (file, sessionId) => {
    const fd = new FormData();
    fd.append("file", file);
    if (sessionId) fd.append("sessionId", sessionId);
    return http("/upload", { method: "POST", body: fd, isForm: true });
  },
  feasibility: (payload) => http("/feasibility", { method: "POST", body: payload }),
  geocode: (query) => http("/geocode", { method: "POST", body: { query } }),
  compliance: (payload) => http("/compliance", { method: "POST", body: payload }),
  permits: (payload) => http("/permits", { method: "POST", body: payload }),
  snowflakeDemo: () => http("/snowflake/demo")
};
