import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";

export function useTenantTheme() {
  const tenant = useTenantStore((s) => s.tenant);
  const darkMode = useUIStore((s) => s.darkMode);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;

    if (tenant?.theme_config) {
      const { primary_color, secondary_color, accent_color, font_family } =
        tenant.theme_config;
      root.style.setProperty("--color-primary", primary_color);
      root.style.setProperty("--color-secondary", secondary_color);
      root.style.setProperty("--color-accent", accent_color);
      root.style.setProperty("--font-family", font_family);
    }

    // Dark mode
    root.classList.toggle("dark", darkMode);

    // RTL / LTR
    root.dir = language === "ar" ? "rtl" : "ltr";
    root.lang = language;
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
