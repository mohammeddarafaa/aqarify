/**
 * Resolves i18next language code for Arabic tenants (MSA + regional bundles).
 * English UI stays `en`.
 */
export function resolveArabicI18nLng(
  defaultLocale?: string | null,
  countryCode?: string | null,
): "ar" | "ar-EG" | "ar-SA" | "ar-AE" {
  const dl = defaultLocale?.replace(/_/g, "-").toLowerCase() ?? "";
  if (dl.startsWith("ar-sa")) return "ar-SA";
  if (dl.startsWith("ar-ae")) return "ar-AE";
  if (dl.startsWith("ar-eg")) return "ar-EG";
  const cc = (countryCode ?? "EG").toUpperCase();
  if (cc === "SA") return "ar-SA";
  if (cc === "AE") return "ar-AE";
  if (cc === "EG") return "ar-EG";
  return "ar";
}
