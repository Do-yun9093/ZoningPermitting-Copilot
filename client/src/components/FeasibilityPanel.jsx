import { useState } from "react";
import { api } from "../lib/api";
import SiteMap from "./SiteMap";

function ScoreBar({ label, score, note, color }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="label">{label}</div>
        <div className="text-2xl font-semibold text-stone-900">{score}</div>
      </div>
      <div className="h-2 rounded-full bg-butter overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <div className="muted mt-1.5">{note}</div>
    </div>
  );
}

// Default region: Sydney, NSW, Australia.
const DEFAULT_LAT = -33.8688;
const DEFAULT_LNG = 151.2093;

export default function FeasibilityPanel({ session, onSession, onFeasibility }) {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [size, setSize] = useState(4500);
  const [address, setAddress] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState(null);
  const [geoNote, setGeoNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  async function searchAddress() {
    if (!address.trim()) return;
    setGeoBusy(true);
    setGeoErr(null);
    setGeoNote(null);
    try {
      const r = await api.geocode(address);
      setLat(r.lat);
      setLng(r.lng);
      setGeoNote(r.demo ? `Demo geocode (add ORS_API_KEY for real lookups) — ${r.label}` : r.label);
    } catch (e) {
      setGeoErr(e.message);
    } finally {
      setGeoBusy(false);
    }
  }

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.feasibility({
        lat: Number(lat),
        lng: Number(lng),
        projectSize: Number(size),
        sessionId: session?.id
      });
      onSession(r.sessionId || session?.id);
      onFeasibility(r);
      setResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-900">Site Feasibility</h1>
        <p className="muted">
          Score a site on flood, seismic, and transit. Map shows risk overlay
          and nearby comparable-zoning parcels.
        </p>
      </div>

      <div className="card p-4 mb-3">
        <div className="label mb-1">Search address (Australia)</div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. 200 George St, Sydney NSW"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAddress()}
          />
          <button onClick={searchAddress} className="btn-primary" disabled={geoBusy}>
            {geoBusy ? "Locating…" : "Find on map"}
          </button>
        </div>
        {geoNote && <div className="muted mt-1.5">{geoNote}</div>}
        {geoErr && (
          <div className="mt-1.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {geoErr}
          </div>
        )}
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="label mb-1">Latitude</div>
          <input
            className="input"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div>
          <div className="label mb-1">Longitude</div>
          <input
            className="input"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <div>
          <div className="label mb-1">Project size (sq ft)</div>
          <input
            className="input"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <button onClick={run} className="btn-primary" disabled={busy}>
            {busy ? "Scoring…" : "Run feasibility"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="card p-4 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl grid place-items-center text-white text-2xl font-semibold"
              style={{
                background:
                  result.overall.rating === "A" ? "#F59E0B" :
                  result.overall.rating === "B" ? "#FB923C" :
                  result.overall.rating === "C" ? "#FCD34D" :
                  result.overall.rating === "D" ? "#FDBA74" : "#FCA5A5"
              }}
            >
              {result.overall.rating}
            </div>
            <div className="flex-1">
              <div className="label">Overall site rating</div>
              <div className="text-xl font-semibold text-stone-900">
                {result.overall.score} / 100
              </div>
              <div className="muted">
                Based on weighted flood, seismic, and transit scores.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ScoreBar
              label="Flood"
              score={result.scores.flood.score}
              note={`${result.scores.flood.label} · ${result.scores.flood.note}`}
              color="#F97316"
            />
            <ScoreBar
              label="Seismic"
              score={result.scores.seismic.score}
              note={`${result.scores.seismic.label} · ${result.scores.seismic.note}`}
              color="#F59E0B"
            />
            <ScoreBar
              label="Transit"
              score={result.scores.transit.score}
              note={`${result.scores.transit.label} · ${result.scores.transit.note}`}
              color="#FBBF24"
            />
          </div>

          <div className="card p-4">
            <div className="section-title mb-2">Map</div>
            <SiteMap
              site={{ lat: result.site.lat, lng: result.site.lng }}
              overlay={result.mapOverlay}
              parcels={result.nearbyParcels}
            />
            <div className="muted mt-1.5">
              Map tiles © OpenStreetMap contributors. Address search via OpenRouteService.
            </div>
            <div className="mt-3">
              <div className="label mb-1">Nearby comparable-zoning parcels</div>
              <ul className="text-sm space-y-1">
                {result.nearbyParcels.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="chip">{p.zone}</span>
                    <span className="text-stone-700">{p.note}</span>
                    <span className="text-stone-400 text-xs">
                      Δ {p.distanceDeg}°
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
