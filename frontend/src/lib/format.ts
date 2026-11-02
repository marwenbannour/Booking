// Helpers de formatage (dates, prix) côté client.

import type { Lang } from "@/lib/i18n";

function intlLocale(locale: Lang): string {
  return locale === "ar" ? "ar-TN" : "fr-FR";
}

export function formatTime(iso: string, timeZone?: string, locale: Lang = "fr"): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, timeZone?: string, locale: Lang = "fr"): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPrice(price?: string | null, currency = "TND", locale: Lang = "fr"): string {
  if (price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return `${price} ${currency}`;
  return `${n.toLocaleString(intlLocale(locale), { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${currency}`;
}

export function statusClass(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "PENDING":
      return "pending";
    case "COMPLETED":
      return "completed";
    default:
      return "cancelled";
  }
}
