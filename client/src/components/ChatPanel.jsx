import { useState } from "react";
import { api } from "../lib/api";
import { SendIcon, SparkleIcon } from "./Icons";

const SUGGESTIONS = [
  "What's the max FAR for an R-2 lot?",
  "Does my front setback of 12 ft meet the requirement?",
  "How much parking do I need for a 6-unit townhouse?",
  "Is the site inside a floodplain?"
];

export default function ChatPanel({ session, onSession, facts, onFacts }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about zoning. If you upload a site plan or application in the Upload tab, I'll ground every answer in that document.",
      citations: []
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [zone, setZone] = useState("R-2");

  async function send(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: trimmed, citations: [] }]);
    setBusy(true);
    try {
      const r = await api.chat({
        message: trimmed,
        sessionId: session?.id,
        zoneHint: zone
      });
      onSession(r.sessionId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: r.answer,
          citations: r.citations || [],
          demo: r.demo
        }
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${e.message}`, citations: [] }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Zoning Chat</h1>
          <p className="muted">
            RAG over municipal code, grounded in your uploaded document.
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
        </div>
      </div>

      {Object.keys(facts || {}).length > 0 && (
        <div className="card px-4 py-3 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <SparkleIcon className="w-4 h-4 text-pumpkin" />
            <div className="text-sm font-semibold text-stone-800">
              Document is active in this session
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(facts).map(([k, v]) => (
              <span key={k} className="chip">
                <span className="text-stone-500">{k}:</span>
                <span className="text-stone-800">{String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-pumpkin text-white"
                : "mr-auto bg-butter/60 text-stone-800 border border-butter"
            ].join(" ")}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.citations?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.citations.map((c) => (
                  <span
                    key={c.id}
                    className="text-[11px] rounded-full bg-white/80 border border-butter px-2 py-0.5 text-stone-700"
                  >
                    [{c.index}] {c.id} · {c.zone}
                  </span>
                ))}
              </div>
            )}
            {m.demo && (
              <div className="mt-2 text-[11px] italic text-amber-700">
                Demo response — set GROQ_API_KEY for live answers.
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="mr-auto chip">thinking…</div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs rounded-full bg-white border border-butter hover:bg-butter/70 text-stone-700 px-3 py-1.5 transition"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <input
            className="input"
            placeholder="Ask a zoning question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            <SendIcon className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
