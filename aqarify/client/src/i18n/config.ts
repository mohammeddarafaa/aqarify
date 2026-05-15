import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import arCommon from "./ar/common.json";
import arBrowse from "./ar/browse.json";
import arDashboard from "./ar/dashboard.json";
import arEGCommonPatch from "./ar-EG/common.json";
import arEGBrowsePatch from "./ar-EG/browse.json";
import arEGDashboardPatch from "./ar-EG/dashboard.json";
import arSACommonPatch from "./ar-SA/common.json";
import arSABrowsePatch from "./ar-SA/browse.json";
import arSADashboardPatch from "./ar-SA/dashboard.json";
import arAECommonPatch from "./ar-AE/common.json";
import arAEBrowsePatch from "./ar-AE/browse.json";
import arAEDashboardPatch from "./ar-AE/dashboard.json";
import enCommon from "./en/common.json";
import enBrowse from "./en/browse.json";
import enDashboard from "./en/dashboard.json";
import { mergeDeep } from "./merge-deep";

function bundleRegional(
  commonPatch: Record<string, unknown>,
  browsePatch: Record<string, unknown>,
  dashboardPatch: Record<string, unknown>,
) {
  return {
    common: mergeDeep(arCommon, commonPatch),
    browse: mergeDeep(arBrowse, browsePatch),
    dashboard: mergeDeep(arDashboard, dashboardPatch),
  };
}

const savedLang = localStorage.getItem("aqarify-ui")
  ? (JSON.parse(localStorage.getItem("aqarify-ui")!).state?.language as string | undefined)
  : undefined;

/** Until tenant loads, Arabic UI uses merged regional base (default Egypt). */
const initialLng = savedLang === "en" ? "en" : "ar-EG";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: {
    "ar-EG": ["ar", "en"],
    "ar-SA": ["ar", "en"],
    "ar-AE": ["ar", "en"],
    ar: ["en"],
    en: ["ar"],
    default: ["en"],
  },
  supportedLngs: ["en", "ar", "ar-EG", "ar-SA", "ar-AE"],
  resources: {
    ar: { common: arCommon, browse: arBrowse, dashboard: arDashboard },
    "ar-EG": bundleRegional(arEGCommonPatch, arEGBrowsePatch, arEGDashboardPatch),
    "ar-SA": bundleRegional(arSACommonPatch, arSABrowsePatch, arSADashboardPatch),
    "ar-AE": bundleRegional(arAECommonPatch, arAEBrowsePatch, arAEDashboardPatch),
    en: { common: enCommon, browse: enBrowse, dashboard: enDashboard },
  },
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
