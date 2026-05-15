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

export function tenantCountryToPhoneRegion(iso?: string | null): CountryCode {
  const k = (iso ?? "EG").toUpperCase();
  return (ISO2_TO_PHONE[k] ?? "EG") as CountryCode;
}

export function isValidPhoneForTenant(phone: string, tenantCountryIso?: string | null): boolean {
  const region = tenantCountryToPhoneRegion(tenantCountryIso);
  const parsed = parsePhoneNumberFromString(phone.trim(), region);
  if (parsed?.isValid()) return true;
  const loose = parsePhoneNumberFromString(phone.trim());
  return loose?.isValid() ?? false;
}

export function normalizePhoneE164(phone: string, tenantCountryIso?: string | null): string | null {
  const region = tenantCountryToPhoneRegion(tenantCountryIso);
  const parsed =
    parsePhoneNumberFromString(phone.trim(), region) ?? parsePhoneNumberFromString(phone.trim());
  if (!parsed?.isValid()) return null;
  return parsed.format("E.164");
}
