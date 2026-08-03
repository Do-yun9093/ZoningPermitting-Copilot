// /api/geocode — address → lat/lng lookup for the Feasibility map.
//
// Uses the OpenRouteService (ORS) Geocoding API (https://openrouteservice.org),
// which is free to sign up for. Results are biased to Australia by default
// (ORS_COUNTRY / ORS_DEFAULT_* env vars), matching the demo region for this
// prototype. If no key is configured, a clearly-flagged demo result is
// returned so the UI stays walkable without any setup.

const express = require("express");

const router = express.Router();

const ORS_ENDPOINT = "https://api.openrouteservice.org/geocode/search";

// Default focus point: Sydney, NSW, Australia — used both as the demo
// fallback coordinate and as a "focus.point" hint to ORS so ambiguous
// queries (e.g. "123 George St") resolve to the right country.
const DEFAULT_REGION = {
  label: "Sydney, NSW, Australia",
  lat: -33.8688,
  lng: 151.2093
};

function hasRealKey() {
  const key = process.env.ORS_API_KEY;
  return Boolean(key && !key.includes("replace_with"));
}

router.post("/", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    if (!hasRealKey()) {
      // Demo fallback so the map is still walkable without an ORS key.
      return res.json({
        demo: true,
        label: `${query.trim()} (demo result — add ORS_API_KEY in server/.env for real geocoding)`,
        lat: DEFAULT_REGION.lat,
        lng: DEFAULT_REGION.lng
      });
    }

    const country = process.env.ORS_COUNTRY || "AUS";
    const params = new URLSearchParams({
      api_key: process.env.ORS_API_KEY,
      text: query.trim(),
      "boundary.country": country,
      "focus.point.lat": String(DEFAULT_REGION.lat),
      "focus.point.lon": String(DEFAULT_REGION.lng),
      size: "1"
    });

    const r = await fetch(`${ORS_ENDPOINT}?${params.toString()}`);
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(r.status).json({ error: "OpenRouteService geocode failed", detail });
    }

    const data = await r.json();
    const feature = data.features && data.features[0];
    if (!feature) {
      return res.status(404).json({ error: `no match found for "${query}"` });
    }

    const [lng, lat] = feature.geometry.coordinates;
    return res.json({
      demo: false,
      label: feature.properties.label,
      lat,
      lng
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[geocode] error:", err);
    return res.status(500).json({ error: "geocode failed", detail: String(err) });
  }
});

module.exports = router;
