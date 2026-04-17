import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import arCommon from "./ar/common.json";
import arBrowse from "./ar/browse.json";
import arDashboard from "./ar/dashboard.json";
import enCommon from "./en/common.json";
import enBrowse from "./en/browse.json";
import enDashboard from "./en/dashboard.json";

const savedLang = localStorage.getItem("aqarify-ui")
  ? JSON.parse(localStorage.getItem("aqarify-ui")!).state?.language
  : null;

i18n.use(initReactI18next).init({
  lng: savedLang ?? "ar",
  fallbackLng: "en",
  resources: {
    ar: { common: arCommon, browse: arBrowse, dashboard: arDashboard },
    en: { common: enCommon, browse: enBrowse, dashboard: enDashboard },
  },
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
