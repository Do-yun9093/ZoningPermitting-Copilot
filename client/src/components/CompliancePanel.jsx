import { useState } from "react";
import { api } from "../lib/api";

function StatusPill({ status }) {
  const map = {
    pass: { label: "PASS", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    fail: { label: "FAIL", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    unclear: { label: "UNCLEAR", cls: "bg-butter text-amber-800 border-marigold" }
  };
  const s = map[status] || map.unclear;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function CompliancePanel({ session, onSession, facts, onCompliance, complianceResult }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [zone, setZone] = useState(facts?.zone || "R-2");

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.compliance({
        sessionId: session?.id,
        zoneHint: zone
      });
      onSession(r.sessionId);
      onCompliance(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const noFacts = !facts || Object.keys(facts).length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Compliance Gap Report</h1>
          <p className="muted">
            Side-by-side: each code requirement vs. what your uploaded plan shows.
            Pass / fail / unclear, with the section cited.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="label">Zone</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="input !w-auto"
          >
            <option value="R-2">R-2</option>
            <option value="C-1">C-1</option>
          </select>
          <button onClick={run} className="btn-primary" disabled={busy}>
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {noFacts && (
        <div className="card p-4 text-sm text-amber-800 bg-butter/60 border-marigold">
          <strong>Heads up:</strong> no document is uploaded for this session
          yet. Most rows will show as <em>unclear</em>. Upload a site plan or
          paste numbers into the Upload tab to ground this report.
        </div>
      )}

      {err && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {complianceResult && (
        <div className="mt-4 space-y-4">
          <div className="card p-4">
            <div className="section-title">Summary</div>
            <p className="text-sm text-stone-700 mt-1">{complianceResult.summary}</p>
            {complianceResult.demo && (
              <div className="mt-2 text-[11px] italic text-amber-700">
                Summary is a demo response — set GROQ_API_KEY for live LLM summary.
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-butter/60 text-stone-700">
                  <th className="text-left font-semibold px-4 py-2.5">Requirement</th>
                  <th className="text-left font-semibold px-4 py-2.5">Code</th>
                  <th className="text-left font-semibold px-4 py-2.5">Required</th>
                  <th className="text-left font-semibold px-4 py-2.5">Your plan</th>
                  <th className="text-left font-semibold px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {complianceResult.rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-butter hover:bg-butter/30 transition"
                  >
                    <td className="px-4 py-2.5 font-medium text-stone-900">
                      {r.requirement}
                    </td>
                    <td className="px-4 py-2.5 text-stone-700">
                      <div className="font-mono text-[12px] text-stone-800">
                        {r.codeCitation.id}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {r.codeCitation.title}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-stone-700">{r.required}</td>
                    <td className="px-4 py-2.5 text-stone-700">{r.proposed}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!complianceResult && !busy && !err && (
        <div className="card p-8 text-center mt-4">
          <div className="text-stone-500 text-sm">
            Click <strong>Generate</strong> to build a compliance report from
            this session's uploaded document and the municipal code.
          </div>
        </div>
      )}
    </div>
  );
}
