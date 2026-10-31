"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type NotificationJobRow } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { formatDate, formatTime } from "@/lib/format";

const EVENT_LABELS: Record<string, string> = {
  BOOKING_CONFIRMED: "Confirmation",
  BOOKING_REMINDER_DUE: "Rappel",
  BOOKING_CANCELLED: "Annulation",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En file",
  PROCESSING: "En cours",
  SENT: "Envoyé",
  DELIVERED: "Remis",
  FAILED: "Échec",
  UNKNOWN: "Inconnu",
  CANCELLED: "Annulé",
};

function badgeClass(status: string): string {
  if (status === "SENT" || status === "DELIVERED") return "confirmed";
  if (status === "PENDING" || status === "PROCESSING") return "pending";
  if (status === "CANCELLED") return "completed";
  return "cancelled";
}

export default function NotificationsPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<NotificationJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    api
      .listNotifications(establishmentId, { limit: 100 })
      .then((res) => setRows(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

  useEffect(load, [load]);

  return (
    <AppShell title={t("nav.notifications")} subtitle="Historique des rappels et messages WhatsApp">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="panel">
        {loading ? (
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 12, padding: "18px 0" }}>{t("common.none")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Canal</th>
                  <th>Programmé</th>
                  <th>Statut</th>
                  <th>Tentatives</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td><strong>{EVENT_LABELS[n.eventType] ?? n.eventType}</strong></td>
                    <td>
                      <span className="row" style={{ gap: 5 }}>
                        <MessageCircle size={13} style={{ color: "var(--teal)" }} />
                        {n.channel}
                      </span>
                    </td>
                    <td>{formatDate(n.scheduledAt)} · {formatTime(n.scheduledAt)}</td>
                    <td>
                      <span className={`status ${badgeClass(n.status)}`}>{STATUS_LABELS[n.status] ?? n.status}</span>
                      {n.errorCode && <div className="t-muted" style={{ fontSize: 8, marginTop: 3 }}>{n.errorCode}</div>}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{n.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
