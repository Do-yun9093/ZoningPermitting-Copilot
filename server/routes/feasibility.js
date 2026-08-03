// /api/feasibility — takes GPS + project dimensions and returns a flood /
// seismic / transit scorecard plus a map-ready plot point and nearby
// comparable-zoning parcels.
//
// The scores are deterministic and rule-based for the prototype; in
// production wire to FEMA flood maps, USGS seismic data, and GTFS feeds.

const express = require("express");
const { getSession, setFeasibility } = require("../lib/session");

const router = express.Router();

// Offsets (in degrees) from the queried site — kept small and relative so
// the "nearby" parcels land close to whatever real-world site is scored,
// rather than always plotting near absolute (0, 0).
const ZONE_PARCEL_OFFSETS = [
  { id: "P-001", zone: "R-2", dLat: 0.0012, dLng: -0.0009, note: "Adjacent corner lot" },
  { id: "P-002", zone: "R-2", dLat: -0.0018, dLng: 0.0011, note: "Across the alley" },
  { id: "P-003", zone: "C-1", dLat: 0.0025, dLng: 0.0023, note: "Mixed-use block" },
  { id: "P-004", zone: "R-2", dLat: -0.0027, dLng: -0.0019, note: "Tear-down candidate" }
];

function distance(a, b) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

function scoreFlood(lat, lng) {
  // Toy model: pretend anything within ±0.002 lat of 0 is a floodplain.
  const inFlood = Math.abs(lat) < 0.002;
  return inFlood
    ? { score: 35, label: "High", note: "Inside 100-yr floodplain — floodplain permit required" }
    : { score: 88, label: "Low", note: "Outside 100-yr floodplain" };
}

function scoreSeismic(lat, lng) {
  // Toy: higher lat => higher category. Real call: USGS.
  const mag = Math.min(1, Math.max(0, (Math.abs(lat) + Math.abs(lng)) / 0.05));
  if (mag < 0.3) return { score: 90, label: "A–B", note: "Low seismic risk" };
  if (mag < 0.6) return { score: 72, label: "C", note: "Moderate — standard code applies" };
  if (mag < 0.8) return { score: 58, label: "D", note: "Geotech investigation required" };
  return { score: 42, label: "E–F", note: "High seismic — enhanced foundation design" };
}

function scoreTransit(lat, lng) {
  // Toy: closer to (0,0) => better transit.
  const d = Math.hypot(lat, lng);
  if (d < 0.002) return { score: 92, label: "Excellent", note: "Within 1/4 mi of frequent transit" };
  if (d < 0.005) return { score: 74, label: "Good", note: "Within 1/2 mi of transit" };
  if (d < 0.01) return { score: 55, label: "Fair", note: "Auto-oriented" };
  return { score: 38, label: "Poor", note: "Car-dependent" };
}

function overall(flood, seismic, transit) {
  const w = 0.4 * flood + 0.35 * seismic + 0.25 * transit;
  if (w >= 80) return { score: Math.round(w), rating: "A" };
  if (w >= 70) return { score: Math.round(w), rating: "B" };
  if (w >= 55) return { score: Math.round(w), rating: "C" };
  if (w >= 40) return { score: Math.round(w), rating: "D" };
  return { score: Math.round(w), rating: "F" };
}

router.post("/", (req, res) => {
  try {
    const { lat, lng, projectSize, sessionId } = req.body || {};
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng (numbers) are required" });
    }

    const flood = scoreFlood(lat, lng);
    const seismic = scoreSeismic(lat, lng);
    const transit = scoreTransit(lat, lng);
    const overallResult = overall(flood.score, seismic.score, transit.score);

    const nearby = ZONE_PARCEL_OFFSETS
      .map((p) => {
        const pLat = lat + p.dLat;
        const pLng = lng + p.dLng;
        return {
          id: p.id,
          zone: p.zone,
          note: p.note,
          lat: pLat,
          lng: pLng,
          distanceDeg: Number(distance({ lat, lng }, { lat: pLat, lng: pLng }).toFixed(4))
        };
      })
      .sort((a, b) => a.distanceDeg - b.distanceDeg)
      .slice(0, 3);

    const result = {
      site: { lat, lng, projectSize: projectSize || null },
      scores: { flood, seismic, transit },
      overall: overallResult,
      nearbyParcels: nearby,
      mapOverlay: {
        center: { lat, lng },
        riskCircleKm: flood.label === "High" ? 0.4 : 0.15,
        riskColor: flood.label === "High" ? "#F97316" : "#FCD34D"
      }
    };

    setFeasibility(sessionId, result);
    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[feasibility] error:", err);
    return res.status(500).json({ error: "feasibility failed", detail: String(err) });
  }
});

module.exports = router;
