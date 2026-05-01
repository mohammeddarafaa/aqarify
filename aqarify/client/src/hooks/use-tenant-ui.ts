import { useTenantStore } from "@/stores/tenant.store";

type TenantFeatureKey = "map_view" | "waitlist" | "leads_pipeline" | "exports";

export function useTenantUi() {
  const tenant = useTenantStore((s) => s.tenant);
  const ui = tenant?.tenant_ui_config;
  const appName = ui?.branding.app_name || tenant?.name || "Portal";
  return { appName, ui, tenant };
}

export function useTenantFeature(key: TenantFeatureKey) {
  const { ui } = useTenantUi();
  return ui?.features[key] ?? true;
}
