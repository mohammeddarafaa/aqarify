import { isApexMarketingHost, resolveTenantSlugLive } from "@/lib/host";

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
    p === "/browse"
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

/**
 * Tenant-aware link target: on apex hosts prefers `/t/:slug/...` when that route exists;
 * otherwise appends `?tenant=`.
 */
export function appendTenantSearch(
  locationPathname: string,
  locationSearch: string,
  targetPath: string
): string {
  const slug = resolveTenantSlugLive(locationPathname, locationSearch);
  if (!slug) return targetPath;

  if (useTenantPathPrefixOnApex(targetPath)) {
    return toTenantPrefixedPath(slug, targetPath);
  }
  return appendTenantSlugToPath(targetPath, slug);
}

/**
 * Like `appendTenantSearch`, but falls back to `tenantSlug` when the current URL has no
 * tenant (e.g. Zustand already resolved the tenant).
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
  if (useTenantPathPrefixOnApex(targetPath)) {
    return toTenantPrefixedPath(tenantSlug, targetPath);
  }
  return appendTenantSlugToPath(targetPath, tenantSlug);
}
