import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const ISO2_TO_PHONE: Record<string, CountryCode> = {
  EG: "EG",
  SA: "SA",
  AE: "AE",
  KW: "KW",
  QA: "QA",
  BH: "BH",
  OM: "OM",
  JO: "JO",
  MA: "MA",
  TN: "TN",
  DZ: "DZ",
  LY: "LY",
};

/** Maps tenant `country_code` (ISO 3166-1 alpha-2) to libphonenumber default region. */
export function tenantCountryToPhoneRegion(iso?: string | null): CountryCode {
  const k = (iso ?? "EG").toUpperCase();
  return (ISO2_TO_PHONE[k] ?? "EG") as CountryCode;
}

/**
 * Validates a phone for the tenant's country; also accepts internationally formatted numbers (E.164).
 */
export function isValidPhoneForTenant(phone: string, tenantCountryIso?: string | null): boolean {
  const region = tenantCountryToPhoneRegion(tenantCountryIso);
  const parsed = parsePhoneNumberFromString(phone.trim(), region);
  if (parsed?.isValid()) return true;
  const loose = parsePhoneNumberFromString(phone.trim());
  return loose?.isValid() ?? false;
}

/** Display / API: prefer E.164 when parse succeeds. */
export function normalizePhoneE164(phone: string, tenantCountryIso?: string | null): string | null {
  const region = tenantCountryToPhoneRegion(tenantCountryIso);
  const parsed =
    parsePhoneNumberFromString(phone.trim(), region) ?? parsePhoneNumberFromString(phone.trim());
  if (!parsed?.isValid()) return null;
  return parsed.format("E.164");
}
