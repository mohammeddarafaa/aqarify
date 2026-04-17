import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function formatCurrency(amount: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  pattern = "dd MMM yyyy",
  lang = "ar"
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

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
  return `+20${digits}`;
}

export function formatNumber(n: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale).format(n);
}
