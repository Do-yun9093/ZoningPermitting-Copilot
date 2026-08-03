import { useRef, useState } from "react";
import { api } from "../lib/api";
import { UploadIcon } from "./Icons";

export default function UploadPanel({ session, onSession, onFacts }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  async function submit() {
    if (!file || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.upload(file, session?.id);
      onSession(r.sessionId);
      onFacts(r.extractedFacts);
      setResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function pick(f) {
    setFile(f);
    setResult(null);
    setErr(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-900">Upload Document</h1>
        <p className="muted">
          Drop a PDF, image, or text file. We'll extract facts (lot size,
          setbacks, FAR, height, parking) and ground every chat answer in
          this document for the rest of the session.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pick(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={[
          "card cursor-pointer border-dashed border-2 flex flex-col items-center justify-center text-center px-6 py-10 transition",
          drag ? "border-pumpkin bg-butter/60" : "border-butter bg-white"
        ].join(" ")}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-marigold to-tangerine grid place-items-center mb-3">
          <UploadIcon className="w-6 h-6 text-white" />
        </div>
        <div className="font-medium text-stone-800">
          {file ? file.name : "Drop a file or click to browse"}
        </div>
        <div className="muted mt-1">
          PDF, PNG, JPG, or TXT · up to 8 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
          onChange={(e) => pick(e.target.files?.[0] || null)}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={submit}
          className="btn-primary"
          disabled={!file || busy}
        >
          {busy ? "Parsing…" : "Parse & ground session"}
        </button>
        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="btn-ghost"
            disabled={busy}
          >
            Clear
          </button>
        )}
      </div>

      {err && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="card p-4">
            <div className="section-title">Extracted facts</div>
            <div className="muted mb-2">
              From {result.filename} · {(result.size / 1024).toFixed(1)} KB
            </div>
            {Object.keys(result.extractedFacts).length === 0 ? (
              <div className="text-sm text-amber-800 bg-butter border border-marigold rounded-lg px-3 py-2">
                No structured facts detected. Try a text-based PDF or .txt.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.extractedFacts).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg bg-butter/60 border border-butter px-3 py-2"
                  >
                    <div className="text-[11px] uppercase tracking-wide text-stone-500">
                      {k}
                    </div>
                    <div className="text-sm font-medium text-stone-900">
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {result.unclearFields?.length > 0 && (
              <div className="mt-3 text-xs text-amber-800">
                Unclear: {result.unclearFields.join(", ")}
              </div>
            )}
          </div>

          {result.preview && (
            <div className="card p-4">
              <div className="section-title">Parsed text preview</div>
              <pre className="mt-2 text-xs whitespace-pre-wrap text-stone-600 max-h-40 overflow-y-auto">
                {result.preview}
                {result.preview.length >= 800 ? "…" : ""}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
