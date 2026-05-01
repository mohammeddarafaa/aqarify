import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";

export function useTenantTheme() {
  const tenant = useTenantStore((s) => s.tenant);
  const darkMode = useUIStore((s) => s.darkMode);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    const getDefaultVar = (name: string, fallback: string) =>
      computedStyles.getPropertyValue(name).trim() || fallback;
    const varsToReset = [
      "--color-primary",
      "--color-secondary",
      "--color-accent",
      "--color-gold",
      "--color-gold-light",
      "--primary",
      "--secondary",
      "--accent",
      "--font-family",
      "--font-sans",
      "--font-arabic",
      "--font-size-base",
      "--tenant-gradient",
      "--sold-badge",
      "--radius-base",
      "--shadow-depth",
      "--spacing-scale",
      "--font-scale",
    ];

    if (tenant?.theme_config) {
      const theme = tenant.theme_config as unknown as Record<string, string | undefined>;
      const primary = theme.primary_color ?? theme.pcolor1 ?? getDefaultVar("--primary", "");
      const secondary =
        theme.secondary_color ?? theme.pcolor2 ?? getDefaultVar("--secondary", "");
      const accent = theme.accent_color ?? theme.pcolor3 ?? getDefaultVar("--accent", primary || "");
      const fontFamily =
        theme.font_family ?? theme.fontFamilyNormal ?? getDefaultVar("--font-sans", "system-ui, sans-serif");
      const fontSansStack = `'Poppins', ${fontFamily}, 'Geist', 'DM Sans', system-ui, sans-serif`;
      const fontArabicStack = `'Cairo', 'Poppins', ${fontFamily}, 'Geist', 'DM Sans', system-ui, sans-serif`;
      const gradient = theme.gradient_primary ?? theme.pcolorG;
      const fontSize = theme.font_size ?? theme.fontSize;
      const soldBadge = theme.sold_badge ?? theme.soldBadge;
      const radius_base = theme.radius_base;
      const shadow_depth = theme.shadow_depth;
      const spacing_scale = theme.spacing_scale;
      const font_scale = theme.font_scale;

      root.style.setProperty("--color-primary", primary);
      root.style.setProperty("--color-secondary", secondary);
      root.style.setProperty("--color-accent", accent);
      root.style.setProperty("--color-gold", accent);
      root.style.setProperty("--color-gold-light", primary);
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--secondary", secondary);
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--font-family", fontSansStack);
      root.style.setProperty("--font-sans", fontSansStack);
      root.style.setProperty("--font-arabic", fontArabicStack);
      if (fontSize) root.style.setProperty("--font-size-base", fontSize);
      if (gradient) root.style.setProperty("--tenant-gradient", gradient);
      if (soldBadge) root.style.setProperty("--sold-badge", soldBadge);
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
