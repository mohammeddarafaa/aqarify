import { useLocation } from "react-router-dom";
import { resolveTenantSlugLive } from "@/lib/host";

/** Reactive tenant slug from the current route (path + query) and hostname. */
export function useTenantSlug(): string | null {
  const { pathname, search } = useLocation();
  return resolveTenantSlugLive(pathname, search);
}

/** True when the app should show the apex marketing site (no tenant context). */
export function useIsMarketingSite(): boolean {
  return useTenantSlug() === null;
}
