import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const LOCALE_MAP: Record<string, string> = {
  EGP: "ar-EG",
  SAR: "ar-SA",
  AED: "ar-AE",
  KWD: "ar-KW",
  QAR: "ar-QA",
  BHD: "ar-BH",
  OMR: "ar-OM",
  JOD: "ar-JO",
  MAD: "ar-MA",
  TND: "ar-TN",
  DZD: "ar-DZ",
  LYD: "ar-LY",
  USD: "en-US",
};

/** Gulf currencies using three fractional digits in Intl. */
export const THREE_DECIMAL_CURRENCIES = new Set(["KWD", "BHD", "OMR"]);

export const REGIONAL_CURRENCIES = [
  "EGP",
  "SAR",
  "AED",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "JOD",
  "MAD",
  "TND",
  "DZD",
] as const;

export function formatCurrency(
  amount: number,
  currency = "EGP",
  language: "ar" | "en" = "ar",
): string {
  const locale = language === "en" ? "en-US" : (LOCALE_MAP[currency] ?? "ar-EG");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: THREE_DECIMAL_CURRENCIES.has(currency) ? 3 : 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  pattern = "dd MMM yyyy",
  lang = "ar",
): string {
  return format(new Date(date), pattern, {
    locale: lang === "ar" ? ar : enUS,
  });
}

export function formatRelativeTime(date: string | Date, lang = "ar"): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: lang === "ar" ? ar : enUS,
  });
}

/**
 * @deprecated Prefer `normalizePhoneE164` / `libphonenumber-js` from `@/lib/phone`.
 * Legacy helper: assumes national numbers for `defaultCountryCode` (numeric, no +).
 */
export function formatPhone(phone: string, defaultCountryCode = "20"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(defaultCountryCode)) return `+${digits}`;
  if (digits.startsWith("0")) return `+${defaultCountryCode}${digits.slice(1)}`;
  return `+${defaultCountryCode}${digits}`;
}

export function formatNumber(n: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale).format(n);
}
