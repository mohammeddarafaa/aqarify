import { isApexMarketingHost, resolveTenantSlugLive } from "@/lib/host";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";

function splitPathQueryHash(path: string): { pathname: string; query: string; hash: string } {
  const hashIdx = path.indexOf("#");
  const hash = hashIdx >= 0 ? path.slice(hashIdx) : "";
  const pathBeforeHash = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
  const qIdx = pathBeforeHash.indexOf("?");
  const pathname = qIdx >= 0 ? pathBeforeHash.slice(0, qIdx) : pathBeforeHash;
  const query = qIdx >= 0 ? pathBeforeHash.slice(qIdx + 1) : "";
  return { pathname, query, hash };
}

function targetPathnameOnly(targetPath: string): string {
  return splitPathQueryHash(targetPath).pathname;
}

/** Routes that exist under `/t/:tenantSlug/...` on apex (localhost) hosts. */
function useTenantPathPrefixOnApex(targetPath: string): boolean {
  if (!isApexMarketingHost()) return false;
  const p = targetPathnameOnly(targetPath);
  if (
    p === "/login" ||
    p === "/register" ||
    p === "/forgot-password" ||
    p === "/reset-password" ||
    p === "/browse" ||
    p.startsWith("/browse/projects/") ||
    p === "/compare" ||
    p === "/discover"
  ) {
    return true;
  }
  if (p.startsWith("/units/")) return true;
  if (p.startsWith("/checkout/")) return true;
  return false;
}

/** `/t/:slug/login?as=team` — tenant is in the path; `tenant` query is stripped. */
function toTenantPrefixedPath(slug: string, targetPath: string): string {
  const { pathname, query, hash } = splitPathQueryHash(targetPath);
  let rest = pathname;
  const stripped = pathname.match(/^\/t\/[^/]+(\/.*)?$/);
  if (stripped) {
    rest = stripped[1] ?? "/";
  }
  const params = new URLSearchParams(query);
  params.delete("tenant");
  const q = params.toString();
  const pathSeg = rest === "/" ? "" : rest;
  return `/t/${slug}${pathSeg}${q ? `?${q}` : ""}${hash}`;
}

/** Adds `?tenant=` to `targetPath` when `tenantSlug` is set. */
export function appendTenantSlugToPath(targetPath: string, tenantSlug: string | null | undefined): string {
  if (!tenantSlug) return targetPath;
  const { pathname, query, hash } = splitPathQueryHash(targetPath);
  const params = new URLSearchParams(query);
  if (!params.has("tenant")) params.set("tenant", tenantSlug);
  const q = params.toString();
  return `${pathname}${q ? `?${q}` : ""}${hash}`;
}

function applyTenantToTarget(slug: string, targetPath: string): string {
  if (useTenantPathPrefixOnApex(targetPath)) {
    return toTenantPrefixedPath(slug, targetPath);
  }
  return appendTenantSlugToPath(targetPath, slug);
}

/**
 * Resolved slug for in-app navigation: current URL first, then hydrated tenant, then
 * logged-in user's tenant (marketing / post-login before URL updates).
 */
export function resolveTenantSlugForLinks(
  locationPathname: string,
  locationSearch: string
): string | null {
  return (
    resolveTenantSlugLive(locationPathname, locationSearch) ??
    useTenantStore.getState().tenant?.slug ??
    useAuthStore.getState().user?.tenant_slug ??
    null
  );
}

/**
 * Tenant-aware link target: on apex hosts prefers `/t/:slug/...` when that route exists;
 * otherwise appends `?tenant=`.
 *
 * Uses URL tenant when present; otherwise falls back to tenant store and auth profile so
 * dashboard and deep links stay consistent.
 */
export function appendTenantSearch(
  locationPathname: string,
  locationSearch: string,
  targetPath: string
): string {
  const slug = resolveTenantSlugForLinks(locationPathname, locationSearch);
  if (!slug) return targetPath;
  return applyTenantToTarget(slug, targetPath);
}

/**
 * Like `appendTenantSearch`, but when the URL has no tenant, uses `tenantSlug` explicitly
 * (e.g. redirect right after login). If the URL already has a tenant, that wins.
 */
export function appendTenantForSlug(
  tenantSlug: string | null | undefined,
  locationPathname: string,
  locationSearch: string,
  targetPath: string
): string {
  if (!tenantSlug) return targetPath;
  if (resolveTenantSlugLive(locationPathname, locationSearch)) {
    return appendTenantSearch(locationPathname, locationSearch, targetPath);
  }
  return applyTenantToTarget(tenantSlug, targetPath);
}
