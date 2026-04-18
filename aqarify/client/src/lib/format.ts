import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const LOCALE_MAP: Record<string, string> = {
  EGP: "ar-EG",
  SAR: "ar-SA",
  AED: "ar-AE",
  KWD: "ar-KW",
  QAR: "ar-QA",
  BHD: "ar-BH",
  JOD: "ar-JO",
  MAD: "ar-MA",
  TND: "ar-TN",
  DZD: "ar-DZ",
  LYD: "ar-LY",
  USD: "en-US",
};

const THREE_DECIMAL = new Set(["KWD", "BHD", "OMR"]);

export function formatCurrency(
  amount: number,
  currency = "EGP",
  language: "ar" | "en" = "ar",
): string {
  const locale = language === "en" ? "en-US" : (LOCALE_MAP[currency] ?? "ar-EG");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: THREE_DECIMAL.has(currency) ? 3 : 2,
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

export function formatPhone(phone: string, defaultCountryCode = "20"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(defaultCountryCode)) return `+${digits}`;
  if (digits.startsWith("0")) return `+${defaultCountryCode}${digits.slice(1)}`;
  return `+${defaultCountryCode}${digits}`;
}

export function formatNumber(n: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale).format(n);
}
