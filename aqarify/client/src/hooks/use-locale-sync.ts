import { useEffect } from "react";
import i18n from "@/i18n/config";
import { useUIStore } from "@/stores/ui.store";

export function useLocaleSync() {
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }

    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
}
