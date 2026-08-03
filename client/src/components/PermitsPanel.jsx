import { useState } from "react";
import { api } from "../lib/api";

function categoryColor(cat) {
  if (cat === "assessment") return "bg-tangerine/20 text-amber-800 border-tangerine/40";
  if (cat === "hearing") return "bg-marigold/30 text-amber-900 border-marigold";
  return "bg-butter text-stone-700 border-butter";
}

export default function PermitsPanel({ session, onSession, facts, feasibility, compliance }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const signals = [];
      if (feasibility?.scores?.flood?.label === "High") signals.push("flood:high");
      if (feasibility?.scores?.seismic?.label?.startsWith("D") ||
          feasibility?.scores?.seismic?.label?.startsWith("E") ||
          feasibility?.scores?.seismic?.label?.startsWith("F")) {
        signals.push("seismic:high");
      } else if (feasibility?.scores?.seismic?.label === "C") {
        signals.push("seismic:moderate");
      }
      if (feasibility?.scores?.transit?.label === "Poor") signals.push("transit:poor");
      if (feasibility?.scores?.transit?.label === "Fair") signals.push("transit:fair");

      const r = await api.permits({
        sessionId: session?.id,
        zoneHint: facts?.zone || compliance?.zone,
        facts,
        feasibilitySignals: signals,
        compliance
      });
      onSession(r.sessionId);
      setResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const noContext = !feasibility && !compliance;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Permit Checklist</h1>
          <p className="muted">
            Required municipal permits, environmental assessments, and public
            hearings — informed by the feasibility score and compliance gaps
            already identified.
          </p>
        </div>
        <button onClick={run} className="btn-primary" disabled={busy}>
          {busy ? "Generating…" : "Generate checklist"}
        </button>
      </div>

      {noContext && (
        <div className="card p-4 text-sm text-amber-800 bg-butter/60 border-marigold">
          <strong>Tip:</strong> run the <em>Site Feasibility</em> and
          <em> Compliance Gap</em> tabs first so the checklist can reuse their
          signals. Without them, you'll get a baseline permit set only.
        </div>
      )}

      {err && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="label">Estimated total time</div>
              <div className="text-2xl font-semibold text-stone-900">
                {result.totalEtaDays} days
              </div>
              <div className="muted">{result.note}</div>
            </div>
            <div className="w-16 h-16 rounded-2xl grid place-items-center text-white text-2xl font-semibold bg-gradient-to-br from-marigold to-pumpkin">
              {result.items.length}
            </div>
          </div>

          <div className="card divide-y divide-butter">
            {result.items.map((it, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <div
                  className={`mt-0.5 w-9 h-9 rounded-xl border grid place-items-center text-sm font-semibold ${categoryColor(it.category)}`}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-stone-900">{it.name}</div>
                    <span className="chip">{it.category || "permit"}</span>
                  </div>
                  <div className="muted">{it.authority} · ~{it.etaDays} days</div>
                  <div className="text-xs text-stone-500 mt-1">
                    Trigger: {it.trigger}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.demo && (
            <div className="text-[11px] italic text-amber-700">
              Note paragraph is a demo response — set GROQ_API_KEY for live LLM copy.
            </div>
          )}
        </div>
      )}

      {!result && !busy && !err && (
        <div className="card p-8 text-center mt-4">
          <div className="text-stone-500 text-sm">
            Click <strong>Generate checklist</strong> to build a permit plan
            from this session's signals.
          </div>
        </div>
      )}
    </div>
  );
}
