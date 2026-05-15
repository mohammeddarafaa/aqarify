import { useEffect } from "react";
import i18n from "@/i18n/config";
import { resolveArabicI18nLng } from "@/i18n/regional-locale";
import { useTenantStore } from "@/stores/tenant.store";
import { useUIStore } from "@/stores/ui.store";

/** Keeps document `lang`/`dir`, UI language, and regional Arabic bundles in sync. */
export function useLocaleSync() {
  const language = useUIStore((s) => s.language);
  const tenant = useTenantStore((s) => s.tenant);

  useEffect(() => {
    const lng =
      language === "en"
        ? "en"
        : resolveArabicI18nLng(tenant?.default_locale, tenant?.country_code);

    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }

    const root = document.documentElement;
    root.lang = lng.split("-")[0];
    root.dir = lng.startsWith("ar") ? "rtl" : "ltr";
  }, [language, tenant?.default_locale, tenant?.country_code]);
}
