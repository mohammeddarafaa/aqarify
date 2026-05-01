import { Link, Outlet, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantTheme } from "@/hooks/use-tenant-theme";
import { useTenantUi } from "@/hooks/use-tenant-ui";
import { useTenantStore } from "@/stores/tenant.store";
import { appendTenantSearch } from "@/lib/tenant-path";

export default function AuthLayout() {
  useTenant();
  useTenantTheme();
  const { pathname, search } = useLocation();
  const withTenant = (path: string) => appendTenantSearch(pathname, search, path);
  const tenant = useTenantStore((s) => s.tenant);
  const { appName } = useTenantUi();

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
          alt="Property"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--color-foreground)_45%,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-[var(--color-background)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[color-mix(in_oklch,var(--color-background)_80%,transparent)]">{appName}</p>
          <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight">
            ابدأ رحلتك العقارية من منصة موحدة وسريعة.
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to={withTenant("/")} className="mb-8 flex items-center justify-center" aria-label="Home">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-12 object-contain" />
            ) : (
              <div className="flex flex-col items-center leading-none">
                <span className="text-lg font-bold uppercase tracking-widest text-foreground">{appName}</span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {tenant?.tenant_ui_config?.branding.tagline || "Real estate"}
                </span>
              </div>
            )}
          </Link>
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-8">
              <Outlet />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
