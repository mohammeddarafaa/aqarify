import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Link, useLocation } from "react-router-dom";
import type { Unit } from "@/features/browse/types";
import { appendTenantSearch } from "@/lib/tenant-path";
import { useTenantStore } from "@/stores/tenant.store";

/** Free vector basemap (no Mapbox token). @see https://openfreemap.org/ */
const FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** Geographic centre of the Arab world — last-resort map fallback. */
const ARAB_WORLD_FALLBACK = { latitude: 23.885, longitude: 45.079, zoom: 4 };

interface MapViewProps {
  units: Unit[];
  /** Project pin from browse drill-down (overrides unit scatter for initial view). */
  projectLocation?: { lat: number; lng: number } | null;
}

export function MapView({ units, projectLocation }: MapViewProps) {
  const { pathname, search } = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const currencyLabel = tenant?.currency_symbol ?? tenant?.currency ?? "EGP";
  const [selected, setSelected] = useState<Unit | null>(null);

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

  const initialViewState = useMemo(() => {
    const z = tenant?.map_zoom != null ? Number(tenant.map_zoom) : 12;
    if (tenant?.map_center_lat != null && tenant?.map_center_lng != null) {
      return {
        latitude: Number(tenant.map_center_lat),
        longitude: Number(tenant.map_center_lng),
        zoom: Number.isFinite(z) ? z : 12,
      };
    }
    if (projectLocation?.lat != null && projectLocation?.lng != null) {
      return {
        latitude: projectLocation.lat,
        longitude: projectLocation.lng,
        zoom: 11,
      };
    }
    const first = units.find((u) => u.location_lat != null && u.location_lng != null);
    if (first) {
      return {
        latitude: Number(first.location_lat),
        longitude: Number(first.location_lng),
        zoom: 11,
      };
    }
    return ARAB_WORLD_FALLBACK;
  }, [tenant, projectLocation, units]);

  const mapKey = `${initialViewState.latitude},${initialViewState.longitude},${initialViewState.zoom}`;

  return (
    <div
      className="h-[68vh] min-h-[540px] border overflow-hidden flex flex-col"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex-1 min-h-0 w-full">
        <Map
          key={mapKey}
          initialViewState={initialViewState}
          mapStyle={FREE_MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          {markers.map(({ unit, lat, lng }) => (
            <Marker key={unit.id} latitude={lat} longitude={lng}>
              <button
                type="button"
                onClick={() => setSelected(unit)}
                className="px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm"
                style={{
                  borderColor: "white",
                  background: unit.status === "available" ? "var(--color-foreground)" : "var(--color-gold)",
                  color: "white",
                }}
              >
                {currencyLabel} {(unit.price / 1_000_000).toFixed(1)}M
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
                <p className="text-xs text-gray-600">
                  {selected.bedrooms} غرف • {selected.size_sqm} م²
                </p>
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
      {unlocatedCount > 0 && (
        <p className="px-3 py-1 text-xs text-muted-foreground bg-muted/60 border-t shrink-0">
          {unlocatedCount} وحدة لا تحتوي على إحداثيات دقيقة — لن تظهر على الخريطة
        </p>
      )}
    </div>
  );
}
