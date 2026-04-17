import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link, useLocation } from "react-router-dom";
import type { Unit } from "@/features/browse/types";
import { appendTenantSearch } from "@/lib/tenant-path";

interface MapViewProps {
  units: Unit[];
}

export function MapView({ units }: MapViewProps) {
  const { pathname, search } = useLocation();
  const [selected, setSelected] = useState<Unit | null>(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const markers = useMemo(
    () =>
      units
        .filter((u) => u.location_lat != null && u.location_lng != null)
        .map((u) => ({
          unit: u,
          lat: u.location_lat as number,
          lng: u.location_lng as number,
        })),
    [units],
  );

  const unlocatedCount = units.length - markers.length;

  const selectedMarker = useMemo(() => {
    if (!selected) return null;
    return markers.find((m) => m.unit.id === selected.id) ?? null;
  }, [selected, markers]);

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
    <div
      className="h-[68vh] min-h-[540px] border overflow-hidden flex flex-col"
      style={{ borderColor: "var(--color-border)" }}
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={{ latitude: 30.05, longitude: 31.35, zoom: 8 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        className="flex-1 min-h-0"
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

        {selected && selectedMarker && (
          <Popup
            latitude={selectedMarker.lat}
            longitude={selectedMarker.lng}
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
      {unlocatedCount > 0 && (
        <p className="px-3 py-1 text-xs text-muted-foreground bg-muted/60 border-t shrink-0">
          {unlocatedCount} وحدة لا تحتوي على إحداثيات دقيقة — لن تظهر على الخريطة
        </p>
      )}
    </div>
  );
}
