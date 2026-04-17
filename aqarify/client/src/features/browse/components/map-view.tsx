import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link, useLocation } from "react-router-dom";
import type { Unit } from "@/features/browse/types";
import { appendTenantSearch } from "@/lib/tenant-path";

interface MapViewProps {
  units: Unit[];
}

function pseudoCoord(seed: string, min: number, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h << 5) - h + seed.charCodeAt(i);
  const normalized = Math.abs(h % 1000) / 1000;
  return min + (max - min) * normalized;
}

function getUnitCoord(unit: Unit) {
  const lat = pseudoCoord(`${unit.id}-lat`, 29.9, 30.25);
  const lng = pseudoCoord(`${unit.id}-lng`, 31.1, 31.7);
  return { lat, lng };
}

export function MapView({ units }: MapViewProps) {
  const { pathname, search } = useLocation();
  const [selected, setSelected] = useState<Unit | null>(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const markers = useMemo(
    () => units.map((u) => ({ unit: u, ...getUnitCoord(u) })),
    [units]
  );

  if (!token) {
    return (
      <div className="border p-8 text-center" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Map view يحتاج إعداد `VITE_MAPBOX_TOKEN` لعرض الخريطة التفاعلية.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[68vh] min-h-[540px] border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={{ latitude: 30.05, longitude: 31.35, zoom: 8 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-right" />
        {markers.map(({ unit, lat, lng }) => (
          <Marker key={unit.id} latitude={lat} longitude={lng}>
            <button
              onClick={() => setSelected(unit)}
              className="px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm"
              style={{
                borderColor: "white",
                background: unit.status === "available" ? "var(--color-foreground)" : "var(--color-gold)",
                color: "white",
              }}
            >
              EGP {(unit.price / 1_000_000).toFixed(1)}M
            </button>
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={getUnitCoord(selected).lat}
            longitude={getUnitCoord(selected).lng}
            closeOnClick={false}
            onClose={() => setSelected(null)}
            anchor="bottom"
          >
            <div className="w-52 space-y-2">
              <img
                src={selected.gallery?.[0] ?? "https://placehold.co/320x180"}
                alt={selected.unit_number}
                className="w-full h-24 object-cover rounded"
              />
              <p className="font-semibold text-sm">وحدة {selected.unit_number}</p>
              <p className="text-xs text-gray-600">{selected.bedrooms} غرف • {selected.size_sqm} م²</p>
              <Link
                to={appendTenantSearch(pathname, search, `/units/${selected.id}`)}
                className="text-xs underline"
              >
                عرض التفاصيل
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
