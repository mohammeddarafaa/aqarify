import { Link, Outlet, useLocation } from "react-router-dom";
import { AuroraBackground, Card, CardContent } from "@/components/ui-kit";
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
    <AuroraBackground className="min-h-screen">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link
            to={withTenant("/")}
            className="mb-8 flex items-center justify-center"
            aria-label="Home"
          >
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-12 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center leading-none">
                <span className="text-lg font-bold uppercase tracking-widest text-foreground">
                  {appName}
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {tenant?.tenant_ui_config?.branding.tagline || "Real estate"}
                </span>
              </div>
            )}
          </Link>

          <Card className="rounded-2xl border-border/80 bg-background/80 shadow-sm backdrop-blur">
            <CardContent className="p-8">
              <Outlet />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuroraBackground>
  );
}
