"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, ApiError, type BookingListItem } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ShareLink } from "@/components/ShareLink";
import { DashboardChart } from "@/components/DashboardChart";
import { formatTime } from "@/lib/format";

const EXAMPLE: BookingListItem[] = [
  { id: "1", publicReference: "BK-1A2B", status: "CONFIRMED", startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), customerNameSnapshot: "Yasmine Gharbi", service: { id: "s", name: "Coupe femme" }, employee: { id: "e", displayName: "Salma" } },
  { id: "2", publicReference: "BK-3C4D", status: "PENDING", startsAt: new Date(Date.now() + 3.6e6).toISOString(), endsAt: new Date().toISOString(), customerNameSnapshot: "Karim Ben Ali", service: { id: "s2", name: "Barbe" }, employee: { id: "e2", displayName: "Nabil" } },
  { id: "3", publicReference: "BK-5E6F", status: "COMPLETED", startsAt: new Date(Date.now() - 7.2e6).toISOString(), endsAt: new Date().toISOString(), customerNameSnapshot: "Ines Toumi", service: { id: "s3", name: "Brushing" }, employee: { id: "e", displayName: "Salma" } },
];

const ACCENTS = ["", "teal", "orange", "rose"] as const;

export default function DashboardPage() {
  const { establishmentId, establishmentSlug } = useAuth();
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [isExample, setIsExample] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishmentId) return;
    let active = true;
    setLoading(true);
    api
      .bookings(establishmentId, { limit: 100 })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setIsExample(false);
      })
      .catch((err) => {
        if (!active) return;
        // L'API n'est pas joignable : on montre des données d'exemple, clairement marquées.
        if (err instanceof ApiError) {
          setItems(EXAMPLE);
          setIsExample(true);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [establishmentId]);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayCount = items.filter((b) => new Date(b.startsAt).toDateString() === today).length;
    const confirmed = items.filter((b) => b.status === "CONFIRMED").length;
    const pending = items.filter((b) => b.status === "PENDING").length;
    const rate = items.length ? Math.round((confirmed / items.length) * 100) : 0;
    return { total: items.length, todayCount, pending, rate };
  }, [items]);

  const upcoming = useMemo(
    () =>
      [...items]
        .filter((b) => new Date(b.startsAt).getTime() >= Date.now() - 3.6e6)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
        .slice(0, 6),
    [items],
  );

  return (
    <AppShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
      actions={
        <Link href="/bookings">
          <Button>Voir tous les rendez-vous</Button>
        </Link>
      }
    >
      {isExample && (
        <p style={{ marginBottom: 14 }}>
          <span className="example-note">Données d&apos;exemple — API injoignable</span>
        </p>
      )}

      <div className="metrics-grid">
        <MetricCard label="Rendez-vous (total)" value={metrics.total} tone="brand" icon="▤" />
        <MetricCard label="Aujourd'hui" value={metrics.todayCount} tone="teal" icon="◷" />
        <MetricCard label="En attente" value={metrics.pending} tone="orange" icon="◔" />
        <MetricCard
          label="Taux de confirmation"
          value={`${metrics.rate} %`}
          tone="rose"
          icon="✓"
          trend={{ direction: "up", value: `${metrics.rate} %`, caption: "des rendez-vous" }}
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 className="t-title">Réservations cette semaine</h2>
              <p className="panel-subtitle">Par jour</p>
            </div>
          </div>
          <DashboardChart items={items} />
        </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="t-title">Prochains rendez-vous</h2>
            <p className="panel-subtitle">Les 6 créneaux à venir</p>
          </div>
        </div>

        {loading ? (
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>
            Aucun rendez-vous à venir.
          </p>
        ) : (
          <div className="today-list">
            {upcoming.map((b, i) => (
              <div className="appointment-row" key={b.id}>
                <span className="time-col">{formatTime(b.startsAt)}</span>
                <span className={`row-accent ${ACCENTS[i % ACCENTS.length]}`} />
                <div className="client-line">
                  <strong>{b.customerNameSnapshot}</strong>
                  <small>
                    {b.service?.name ?? "Service"} · {b.employee?.displayName ?? "—"}
                  </small>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ShareLink slug={establishmentSlug} />
      </div>
    </AppShell>
  );
}
