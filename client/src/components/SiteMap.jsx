import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Real, interactive map for the Feasibility tab — OpenStreetMap tiles via
// Leaflet, with the site pin, its flood/risk overlay circle, and nearby
// comparable-zoning parcels plotted at their real lat/lng. Address search
// (in FeasibilityPanel) resolves through OpenRouteService geocoding.

// Recenters the map whenever the scored site changes (new search / re-run).
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function SiteMap({ site, overlay, parcels }) {
  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-butter">
      <MapContainer
        center={[site.lat, site.lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Recenter lat={site.lat} lng={site.lng} />

        {/* Flood / risk overlay */}
        <Circle
          center={[site.lat, site.lng]}
          radius={overlay.riskCircleKm * 1000}
          pathOptions={{
            color: overlay.riskColor,
            fillColor: overlay.riskColor,
            fillOpacity: 0.3,
            weight: 1.5,
            dashArray: "4 4"
          }}
        />

        {/* Nearby comparable-zoning parcels */}
        {parcels.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{ color: "#FFFFFF", weight: 1.5, fillColor: "#FB923C", fillOpacity: 1 }}
          >
            <Popup>
              <strong>{p.id}</strong> · {p.zone}
              <br />
              {p.note}
            </Popup>
          </CircleMarker>
        ))}

        {/* Site pin */}
        <CircleMarker
          center={[site.lat, site.lng]}
          radius={10}
          pathOptions={{ color: "#FFFFFF", weight: 2, fillColor: "#F97316", fillOpacity: 1 }}
        >
          <Popup>Your site</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
