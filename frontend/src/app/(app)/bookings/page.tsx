"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError, type BookingListItem, type BookingStatus } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/format";

export default function BookingsPage() {
  const { establishmentId } = useAuth();
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    api
      .bookings(establishmentId, { limit: 100 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

  useEffect(load, [load]);

  async function transition(b: BookingListItem, status: BookingStatus, reason?: string) {
    if (!establishmentId) return;
    setActing(b.id);
    setError(null);
    try {
      await api.transitionBooking(establishmentId, b.id, status, reason);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible.");
    } finally {
      setActing(null);
    }
  }

  return (
    <AppShell title="Rendez-vous" subtitle="Gérez et suivez tous vos rendez-vous">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="panel">
        {loading ? (
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>
            Aucun rendez-vous.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Employé</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th style={{ textAlign: "end" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.customerNameSnapshot}</strong>
                      <div className="t-muted" style={{ fontSize: 8 }}>{b.publicReference}</div>
                    </td>
                    <td>{b.service?.name ?? "—"}</td>
                    <td>{b.employee?.displayName ?? "—"}</td>
                    <td>
                      {formatDate(b.startsAt)} · {formatTime(b.startsAt)}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: "end" }}>
                      <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                        {b.status === "PENDING" && (
                          <Button
                            variant="text"
                            disabled={acting === b.id}
                            onClick={() => transition(b, "CONFIRMED")}
                          >
                            Confirmer
                          </Button>
                        )}
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <Button
                            variant="text"
                            disabled={acting === b.id}
                            onClick={() => transition(b, "CANCELLED", "Annulé par le salon")}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </td>
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
