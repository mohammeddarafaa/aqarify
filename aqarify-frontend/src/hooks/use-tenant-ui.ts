import { useTenantStore } from "@/stores/tenant.store";
import { resolveTenantUiConfig, type TenantUiConfig } from "@/lib/tenant-ui-config";

type TenantFeatureKey = keyof TenantUiConfig["features"];

/**
 * Primary white-label hook.
 *
 * Provides resolved values from:
 *   tenant.tenant_ui_config  (set by admin via the Branding + Content tabs)
 *
 * Usage:
 *   const { appName, tagline, content, feature } = useTenantUi();
 *   const mapEnabled = feature("map_view");
 */
export function useTenantUi() {
  const tenant = useTenantStore((s) => s.tenant);

  // Resolve ui_config — applies defaults from the Zod schema so callers
  // always get a fully-populated object, never null/undefined.
  const ui: TenantUiConfig = tenant
    ? (tenant.tenant_ui_config ?? resolveTenantUiConfig(tenant))
    : resolveTenantUiConfig({ name: "Portal" });

  const appName = ui.branding.app_name || tenant?.name || "Portal";
  const tagline = ui.branding.tagline || null;

  function feature(key: TenantFeatureKey): boolean {
    return ui.features[key] ?? true;
  }

  return {
    /** The resolved app name shown in sidebar, navbar, document title, etc. */
    appName,
    /** Optional tagline shown below the app name in sidebar + auth layout. */
    tagline,
    /** Full ui_config object (branding, features, localization, content). */
    ui,
    /** Raw tenant (may be null while loading). */
    tenant,
    /** Check if a feature flag is enabled for this tenant. */
    feature,
    /** Shorthand: content strings for landing/public pages. */
    content: ui.content,
    /** Shorthand: localization settings. */
    locale: ui.localization,
    /** Currency from tenant settings, falling back to locale default. */
    currency: tenant?.currency ?? tenant?.fallback_currency ?? "EGP",
    /** Whether the tenant's locale is right-to-left. */
    isRtl: ui.localization.rtl,
  };
}

/** Convenience hook for a single feature flag. */
export function useTenantFeature(key: TenantFeatureKey): boolean {
  const { feature } = useTenantUi();
  return feature(key);
}

/**
 * Returns the document title with the tenant's app name appended.
 * Usage: const title = useTenantTitle("الوحدات");  // "الوحدات — Acme Realty"
 */
export function useTenantTitle(pageTitle: string): string {
  const { appName } = useTenantUi();
  return `${pageTitle} — ${appName}`;
}
