// Single source of truth for: "are we on the Aqarify marketing site,
// or a specific tenant's property portal?"
//
// Resolution rules (checked in order):
//   1. Explicit path segment "/t/<slug>" → tenant mode (dev helper).
//   2. Explicit query "?tenant=<slug>"    → tenant mode (dev helper).
//   3. A non-marketing hostname with a real subdomain (e.g. kdev.aqarify.com,
//      or a tenant's own custom domain) → tenant mode, first sub-domain
//      becomes the slug.
//   4. Anything else (aqarify.com, www.aqarify.com, localhost, 127.0.0.1,
//      Vercel preview URL, etc.) → the Aqarify MARKETING site.
//
// NOTE: We intentionally do NOT auto-promote `VITE_DEFAULT_TENANT` to a
// tenant override. It caused localhost to silently show tenant UIs and
// hide the marketing / pricing pages. If you need that behaviour for
// local dev, set `VITE_FORCE_TENANT=1` and `VITE_DEFAULT_TENANT=<slug>`.

const MARKETING_HOSTS = new Set<string>([
  "aqarify.com",
  "www.aqarify.com",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

function readExplicitOverride(pathname: string, search: string): string | null {
  const match = pathname.match(/^\/t\/([^/]+)/);
  if (match) return match[1];

  const params = new URLSearchParams(search);
  const queryTenant = params.get("tenant");
  if (queryTenant) return queryTenant;

  const forceTenant =
    (import.meta.env.VITE_FORCE_TENANT as string | undefined) === "1";
  const envTenant = import.meta.env.VITE_DEFAULT_TENANT as string | undefined;
  if (forceTenant && envTenant) return envTenant;

  return null;
}

/** True on localhost / apex hosts where tenant is usually `?tenant=` or `/t/:slug/` (not a real subdomain). */
export function isApexMarketingHost(): boolean {
  if (typeof window === "undefined") return false;
  return MARKETING_HOSTS.has(window.location.hostname);
}

/**
 * Resolve tenant slug using an explicit pathname + search (from React Router)
 * plus the current hostname. Use this inside the SPA so `?tenant=` changes apply
 * without a full page reload.
 */
export function resolveTenantSlugLive(
  pathname: string,
  search: string
): string | null {
  if (typeof window === "undefined") return null;

  const siteMode = (import.meta.env.VITE_SITE_MODE as string | undefined)?.trim() || "auto";
  if (siteMode === "marketing") return null;

  const explicit = readExplicitOverride(pathname, search);
  if (explicit) return explicit;

  const hostname = window.location.hostname;

  if (siteMode === "tenant") {
    if (!MARKETING_HOSTS.has(hostname)) {
      const parts = hostname.split(".");
      if (parts.length >= 3 && parts[0] !== "www") return parts[0];
    }
    const def = import.meta.env.VITE_DEFAULT_TENANT as string | undefined;
    return def?.trim() || null;
  }

  if (MARKETING_HOSTS.has(hostname)) return null;

  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[0] !== "www") return parts[0];
  return null;
}

export function resolveTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  return resolveTenantSlugLive(
    window.location.pathname,
    window.location.search
  );
}

/** @deprecated Prefer `useIsMarketingSite()` — this is only true for the initial URL at module load. */
export function isMarketingHost(): boolean {
  return resolveTenantSlug() === null;
}
