"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  api,
  ApiError,
  type BookingListItem,
  type BookingStatus,
  type RescheduleRequestItem,
} from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "•"
  );
}

export default function BookingsPage() {
  const { establishmentId } = useAuth();
  const { t, lang } = useI18n();
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<
    RescheduleRequestItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [actingOnRequest, setActingOnRequest] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.bookings(establishmentId, { limit: 100 }),
      api.rescheduleRequests(establishmentId),
    ])
      .then(([bookings, requests]) => {
        setItems(bookings.items);
        setRescheduleRequests(requests);
      })
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : t("common.loadFailed"),
        ),
      )
      .finally(() => setLoading(false));
  }, [establishmentId, t]);

  useEffect(load, [load]);

  async function transition(
    b: BookingListItem,
    status: BookingStatus,
    reason?: string,
  ) {
    if (!establishmentId) return;
    setActing(b.id);
    setError(null);
    try {
      await api.transitionBooking(establishmentId, b.id, status, reason);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("common.actionFailed"),
      );
    } finally {
      setActing(null);
    }
  }

  async function decideReschedule(
    request: RescheduleRequestItem,
    decision: "ACCEPTED" | "REJECTED",
  ) {
    if (!establishmentId) return;
    setActingOnRequest(request.id);
    setError(null);
    try {
      await api.decideRescheduleRequest(
        establishmentId,
        request.bookingId,
        request.id,
        decision,
        decision === "REJECTED"
          ? t("bookings.rescheduleRejectReason")
          : undefined,
      );
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("common.actionFailed"),
      );
    } finally {
      setActingOnRequest(null);
    }
  }

  return (
    <AppShell title={t("nav.bookings")} subtitle={t("bookings.subtitle")}>
      {error && (
        <p className="api-error" style={{ marginBottom: 14 }}>
          {error}
        </p>
      )}

      {rescheduleRequests.length > 0 && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <h2 className="t-h3">{t("bookings.rescheduleRequests")}</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("bookings.client")}</th>
                  <th>{t("bookings.service")}</th>
                  <th>{t("bookings.employee")}</th>
                  <th>{t("bookings.rescheduleOriginal")}</th>
                  <th>{t("bookings.rescheduleRequested")}</th>
                  <th style={{ textAlign: "end" }}>{t("bookings.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rescheduleRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="cell-user">
                        <span className="ava" aria-hidden>{initials(request.booking.customerNameSnapshot)}</span>
                        <div className="nm">
                          <strong>{request.booking.customerNameSnapshot}</strong>
                          <small>{request.booking.publicReference}</small>
                        </div>
                      </div>
                    </td>
                    <td>{request.booking.serviceNameSnapshot}</td>
                    <td>
                      {request.booking.employee.displayName} →{" "}
                      {request.requestedEmployee.displayName}
                    </td>
                    <td>
                      {formatDate(request.originalStartsAt, undefined, lang)} ·{" "}
                      {formatTime(request.originalStartsAt, undefined, lang)}
                    </td>
                    <td>
                      {formatDate(request.requestedStartsAt, undefined, lang)} ·{" "}
                      {formatTime(request.requestedStartsAt, undefined, lang)}
                    </td>
                    <td style={{ textAlign: "end" }}>
                      <div
                        className="row"
                        style={{ justifyContent: "flex-end", gap: 6 }}
                      >
                        <Button
                          variant="text"
                          disabled={actingOnRequest === request.id}
                          onClick={() => decideReschedule(request, "ACCEPTED")}
                        >
                          {t("bookings.rescheduleAccept")}
                        </Button>
                        <Button
                          variant="text"
                          disabled={actingOnRequest === request.id}
                          onClick={() => decideReschedule(request, "REJECTED")}
                        >
                          {t("bookings.rescheduleReject")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="panel">
        {loading ? (
          <div
            className="row"
            style={{ justifyContent: "center", padding: 24 }}
          >
            <div className="spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>
            {t("bookings.empty")}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("bookings.client")}</th>
                  <th>{t("bookings.service")}</th>
                  <th>{t("bookings.employee")}</th>
                  <th>{t("bookings.date")}</th>
                  <th>{t("bookings.status")}</th>
                  <th style={{ textAlign: "end" }}>{t("bookings.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-user">
                        <span className="ava" aria-hidden>{initials(b.customerNameSnapshot)}</span>
                        <div className="nm">
                          <strong>{b.customerNameSnapshot}</strong>
                          <small>{b.publicReference}</small>
                        </div>
                      </div>
                    </td>
                    <td>{b.service?.name ?? "—"}</td>
                    <td>{b.employee?.displayName ?? "—"}</td>
                    <td>
                      {formatDate(b.startsAt, undefined, lang)} ·{" "}
                      {formatTime(b.startsAt, undefined, lang)}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: "end" }}>
                      <div
                        className="row"
                        style={{ justifyContent: "flex-end", gap: 6 }}
                      >
                        {b.status === "PENDING" && (
                          <Button
                            variant="text"
                            disabled={acting === b.id}
                            onClick={() => transition(b, "CONFIRMED")}
                          >
                            {t("bookings.confirm")}
                          </Button>
                        )}
                        {(b.status === "PENDING" ||
                          b.status === "CONFIRMED") && (
                          <Button
                            variant="text"
                            disabled={acting === b.id}
                            onClick={() =>
                              transition(
                                b,
                                "CANCELLED",
                                t("bookings.cancelReason"),
                              )
                            }
                          >
                            {t("bookings.cancel")}
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
