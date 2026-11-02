"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type NotificationJobRow } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { formatDate, formatTime } from "@/lib/format";

function badgeClass(status: string): string {
  if (status === "SENT" || status === "DELIVERED") return "confirmed";
  if (status === "PENDING" || status === "PROCESSING") return "pending";
  if (status === "CANCELLED") return "completed";
  return "cancelled";
}

export default function NotificationsPage() {
  const { establishmentId } = useAuth();
  const { t, lang } = useI18n();
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
      .catch((err) => setError(err instanceof ApiError ? err.message : t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [establishmentId, t]);

  useEffect(load, [load]);

  return (
    <AppShell title={t("nav.notifications")} subtitle={t("notifications.subtitle")}>
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
                  <th>{t("notifications.type")}</th>
                  <th>{t("notifications.channel")}</th>
                  <th>{t("notifications.scheduled")}</th>
                  <th>{t("notifications.status")}</th>
                  <th>{t("notifications.attempts")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="cell-user">
                        <span className="ava" aria-hidden style={{ background: "var(--success)" }}>
                          <MessageCircle size={15} />
                        </span>
                        <div className="nm"><strong>{t(`notification.event.${n.eventType}`)}</strong></div>
                      </div>
                    </td>
                    <td>
                      <span className="row" style={{ gap: 5 }}>
                        <MessageCircle size={13} style={{ color: "var(--teal)" }} />
                        {n.channel}
                      </span>
                    </td>
                    <td>{formatDate(n.scheduledAt, undefined, lang)} · {formatTime(n.scheduledAt, undefined, lang)}</td>
                    <td>
                      <span className={`status ${badgeClass(n.status)}`}>{t(`notification.status.${n.status}`)}</span>
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
