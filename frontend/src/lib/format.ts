// Helpers de formatage (dates, prix) côté client.

export function formatTime(iso: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPrice(price?: string | null, currency = "TND"): string {
  if (price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return `${price} ${currency}`;
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${currency}`;
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absence",
  REJECTED: "Rejeté",
};

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
