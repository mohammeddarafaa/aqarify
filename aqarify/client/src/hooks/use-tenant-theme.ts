import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";

export function useTenantTheme() {
  const tenant = useTenantStore((s) => s.tenant);
  const darkMode = useUIStore((s) => s.darkMode);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    const varsToReset = [
      "--color-primary",
      "--color-secondary",
      "--color-accent",
      "--font-family",
      "--radius-base",
      "--shadow-depth",
      "--spacing-scale",
      "--font-scale",
    ];

    if (tenant?.theme_config) {
      const {
        primary_color,
        secondary_color,
        accent_color,
        font_family,
        radius_base,
        shadow_depth,
        spacing_scale,
        font_scale,
      } =
        tenant.theme_config;
      root.style.setProperty("--color-primary", primary_color);
      root.style.setProperty("--color-secondary", secondary_color);
      root.style.setProperty("--color-accent", accent_color);
      root.style.setProperty("--font-family", font_family);
      if (radius_base) root.style.setProperty("--radius-base", radius_base);
      if (shadow_depth) root.style.setProperty("--shadow-depth", shadow_depth);
      if (spacing_scale) root.style.setProperty("--spacing-scale", spacing_scale);
      if (font_scale) root.style.setProperty("--font-scale", font_scale);
    }

    // Dark mode
    root.classList.toggle("dark", darkMode);

    // RTL / LTR
    root.dir = language === "ar" ? "rtl" : "ltr";
    root.lang = language;

    return () => {
      varsToReset.forEach((v) => root.style.removeProperty(v));
    };
  }, [tenant, darkMode, language]);

  // Dynamic favicon
  useEffect(() => {
    if (!tenant?.favicon_url) return;
    const link =
      (document.querySelector("link[rel='icon']") as HTMLLinkElement) ??
      document.createElement("link");
    link.rel = "icon";
    link.href = tenant.favicon_url;
    document.head.appendChild(link);
  }, [tenant?.favicon_url]);
}
