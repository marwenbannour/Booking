"use client";

import { useMemo } from "react";
import type { BookingListItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const SEG_COLORS = ["#14b8a6", "#22c55e", "#3b82f6", "#8b5cf6", "#94a3b8"];

/** Deux panneaux dérivés des réservations : répartition par service (donut)
 *  et charge par employé (barres). Sans dépendance externe. */
export function DashboardInsights({ items }: { items: BookingListItem[] }) {
  const { t } = useI18n();

  const services = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of items) {
      const name = b.service?.name ?? "—";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((sum, [, n]) => sum + n, 0);
    const rows = top.map(([name, count]) => ({ name, count }));
    if (rest > 0) rows.push({ name: t("dashboard.otherServices"), count: rest });
    return rows;
  }, [items, t]);

  const team = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of items) {
      const name = b.employee?.displayName ?? "—";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [items]);

  const total = items.length;
  const teamMax = Math.max(1, ...team.map((m) => m.count));

  // Dégradé conique cumulatif pour le donut.
  let acc = 0;
  const stops = services
    .map((s, i) => {
      const from = (acc / Math.max(1, total)) * 100;
      acc += s.count;
      const to = (acc / Math.max(1, total)) * 100;
      return `${SEG_COLORS[i % SEG_COLORS.length]} ${from}% ${to}%`;
    })
    .join(", ");

  return (
    <div className="insights-grid" style={{ marginTop: 16 }}>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="t-title">{t("dashboard.serviceBreakdown")}</h2>
          </div>
        </div>
        {total === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("dashboard.noData")}</p>
        ) : (
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${stops})` }} aria-hidden>
              <div className="donut-hole">
                <b>{total}</b>
              </div>
            </div>
            <div className="donut-legend">
              {services.map((s, i) => (
                <div className="donut-leg-row" key={s.name}>
                  <span className="sw" style={{ background: SEG_COLORS[i % SEG_COLORS.length] }} />
                  <span className="nm">{s.name}</span>
                  <b>{Math.round((s.count / total) * 100)}%</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="t-title">{t("dashboard.teamLoad")}</h2>
          </div>
        </div>
        {team.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("dashboard.noData")}</p>
        ) : (
          <div className="load-bars">
            {team.map((m) => (
              <div className="load-row" key={m.name}>
                <span className="load-name">{m.name}</span>
                <span className="load-track">
                  <span className="load-fill" style={{ width: `${(m.count / teamMax) * 100}%` }} />
                </span>
                <b>{m.count}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
