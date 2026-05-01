import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, Navigation } from "lucide-react";
import { motionTransitions, revealUpVariants } from "@/components/motion/presets";
import { Button } from "@/components/ui/button";
import { appendTenantSearch } from "@/lib/tenant-path";
import type { PublicProject } from "@/features/browse/hooks/use-public-projects";

interface Props {
  projects: PublicProject[];
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const p = Math.PI / 180;
  const a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lng2 - lng1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export function LocationDiscoveryOnboarding({ projects }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);

  const nearest = useMemo(() => {
    if (!pos) return [];
    return projects
      .filter((p) => p.location_lat != null && p.location_lng != null)
      .map((p) => ({
        p,
        d: distanceKm(pos.lat, pos.lng, Number(p.location_lat), Number(p.location_lng)),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
  }, [projects, pos]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (v) => {
        setPos({ lat: v.coords.latitude, lng: v.coords.longitude });
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <motion.section
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.35 }}
      variants={revealUpVariants}
      className="mb-8 rounded-2xl border border-border bg-muted/35 p-5"
    >
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Onboarding</p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Explore homes near you</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with your location to discover the closest projects, then filter by beds, baths, and price.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={detectLocation} className="rounded-full text-xs">
          <Navigation className="me-1 size-3.5" /> {busy ? "Detecting..." : "Use my location"}
        </Button>
        <Button asChild variant="outline" className="rounded-full text-xs">
          <Link to={withTenant("/discover")}>Guided discovery</Link>
        </Button>
      </div>
      {nearest.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nearest.map(({ p, d }) => (
            <motion.div
              key={p.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...motionTransitions.micro }}
            >
              <Link
                to={withTenant(`/browse/projects/${p.id}`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <MapPin className="size-3.5" /> {p.name} · {d.toFixed(1)} km
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
