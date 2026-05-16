import { Link, Outlet, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantTheme } from "@/hooks/use-tenant-theme";
import { useSyncHomeTenantUrl } from "@/hooks/use-sync-home-tenant-url";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { appendTenantSearch } from "@/lib/tenant-path";

/**
 * Auth layout — white-labeled.
 *
 * Left panel: brand identity (logo, name, tagline, primary gradient)
 * Right panel: auth form (login / register / reset password)
 *
 * On mobile: stacks vertically with a compact brand strip at top.
 */
export default function AuthLayout() {
  useSyncHomeTenantUrl();
  useTenantTheme();

  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();
  const { pathname, search } = useLocation();
  const home = appendTenantSearch(pathname, search, "/");

  const tagline = tenant?.tenant_ui_config?.branding?.tagline;
  const heroTitle = tenant?.tenant_ui_config?.content?.hero_title;
  const heroSub   = tenant?.tenant_ui_config?.content?.hero_subtitle;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Brand panel (left / top on mobile) ──────────────────────── */}
      <div
        className="flex flex-col items-center justify-center gap-6 bg-foreground px-8 py-12 text-background lg:min-h-screen lg:w-[42%] lg:items-start lg:px-16"
        style={{
          background: tenant?.theme_config?.primary_color
            ? `linear-gradient(135deg, ${tenant.theme_config.primary_color}, ${tenant.theme_config.secondary_color ?? tenant.theme_config.primary_color}dd)`
            : undefined,
        }}
      >
        <Link to={home} className="flex items-center gap-3">
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={appName}
              className="h-12 object-contain brightness-0 invert"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-background/20">
              <Sparkles className="h-6 w-6 text-background" />
            </div>
          )}
          <div className="hidden lg:block">
            <p className="text-xl font-bold">{appName}</p>
            {tagline && (
              <p className="text-sm font-medium opacity-70">{tagline}</p>
            )}
          </div>
        </Link>

        <div className="hidden max-w-sm text-start lg:block">
          <h1 className="text-3xl font-bold leading-tight">
            {heroTitle ?? appName}
          </h1>
          {heroSub && (
            <p className="mt-3 text-base font-medium opacity-70">{heroSub}</p>
          )}
        </div>
      </div>

      {/* ── Form panel (right / bottom on mobile) ───────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile brand name (hidden on lg) */}
        <p className="mb-8 text-lg font-bold lg:hidden">{appName}</p>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
