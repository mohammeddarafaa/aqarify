import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { resolveTenantSlugLive } from "@/lib/host";

/**
 * Keeps the browser URL aligned with the logged-in user's home tenant (`users.tenant_id` → slug).
 *
 * Without this, `?tenant=kdevelopments` (or `/t/kdevelopments/...`) can show another developer's
 * branding and catalog while `x-tenant-slug` on API calls uses `user.tenant_slug` — so manager
 * screens and browse look like "the same tenant" but hit different data.
 */
export function useSyncHomeTenantUrl() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isAuthenticated || !user?.tenant_slug || user.role === "super_admin") return;

    const urlSlug = resolveTenantSlugLive(pathname, search);
    if (!urlSlug || urlSlug === user.tenant_slug) return;

    let newPathname = pathname;
    if (pathname.startsWith("/t/")) {
      newPathname = pathname.replace(/^\/t\/[^/]+/, `/t/${user.tenant_slug}`);
    }

    const params = new URLSearchParams(search);
    params.set("tenant", user.tenant_slug);
    const nextSearch = params.toString();

    navigate(
      { pathname: newPathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true },
    );
  }, [isAuthenticated, user?.tenant_slug, user?.role, pathname, search, navigate]);
}
