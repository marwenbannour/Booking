"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type BookingListItem } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { formatTime, statusClass } from "@/lib/format";

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const diff = (date.getDay() + 6) % 7; // lundi = 0
  date.setDate(date.getDate() - diff);
  return date;
}

export default function CalendarPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const load = useCallback(() => {
    if (!establishmentId) return;
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(weekStart.getDate() + 7);
    setLoading(true);
    setError(null);
    api
      .bookings(establishmentId, { from: from.toISOString(), to: to.toISOString(), limit: 200 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId, weekStart]);

  useEffect(load, [load]);

  const byDay = useMemo(() => {
    const map: Record<string, BookingListItem[]> = {};
    for (const b of items) {
      const key = new Date(b.startsAt).toDateString();
      (map[key] ??= []).push(b);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    }
    return map;
  }, [items]);

  function shift(weeks: number) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + weeks * 7);
    setWeekStart(d);
  }

  const todayKey = new Date().toDateString();
  const rangeLabel = `${days[0].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <AppShell
      title={t("nav.calendar")}
      subtitle={rangeLabel}
      actions={
        <div className="row" style={{ gap: 8 }}>
          <Button variant="quiet" onClick={() => shift(-1)}>‹</Button>
          <Button variant="quiet" onClick={() => setWeekStart(startOfWeek(new Date()))}>Aujourd&apos;hui</Button>
          <Button variant="quiet" onClick={() => shift(1)}>›</Button>
        </div>
      }
    >
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {loading ? (
        <div className="row" style={{ justifyContent: "center", padding: 24 }}>
          <div className="spin" />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 10, minWidth: 840 }}>
            {days.map((d) => {
              const key = d.toDateString();
              const dayItems = byDay[key] ?? [];
              const isToday = key === todayKey;
              return (
                <div key={key} className="panel" style={{ padding: 12, minHeight: 320 }}>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <div className="t-muted" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </div>
                    <div
                      className="t-title"
                      style={{
                        marginTop: 4,
                        ...(isToday
                          ? { display: "inline-grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", background: "var(--brand)", color: "var(--on-brand)" }
                          : {}),
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    {dayItems.length === 0 ? (
                      <p className="t-muted" style={{ fontSize: 9, textAlign: "center", padding: "10px 0" }}>—</p>
                    ) : (
                      dayItems.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            borderInlineStartWidth: 3,
                            borderInlineStartStyle: "solid",
                            background: "var(--surface-sunken)",
                            borderRadius: "var(--radius-xs)",
                            padding: "6px 8px",
                          }}
                          className={`cal-event ${statusClass(b.status)}`}
                        >
                          <div style={{ fontSize: 9, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                            {formatTime(b.startsAt)}
                          </div>
                          <div style={{ fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {b.customerNameSnapshot}
                          </div>
                          <div className="t-muted" style={{ fontSize: 8 }}>{b.service?.name ?? ""}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
