"use client";

import { useMemo } from "react";
import type { BookingListItem } from "@/lib/api";

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

/** Barres « réservations par jour » sur la semaine courante (SVG, sans lib). */
export function DashboardChart({ items }: { items: BookingListItem[] }) {
  const { days, counts, max } = useMemo(() => {
    const start = startOfWeek(new Date());
    const ds = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    const cs = ds.map(
      (d) => items.filter((b) => new Date(b.startsAt).toDateString() === d.toDateString()).length,
    );
    return { days: ds, counts: cs, max: Math.max(1, ...cs) };
  }, [items]);

  const W = 320;
  const H = 168;
  const padL = 22;
  const padR = 8;
  const padT = 14;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const band = plotW / 7;
  const barW = Math.min(20, band * 0.52);
  const todayStr = new Date().toDateString();

  const ticks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Réservations par jour" style={{ display: "block" }}>
      {/* grille + axe Y */}
      {ticks.map((v) => {
        const y = padT + plotH - (v / max) * plotH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--line)" strokeDasharray="3 3" />
            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="8" fill="var(--muted)" fontFamily="var(--font-body)">
              {v}
            </text>
          </g>
        );
      })}

      {/* barres */}
      {counts.map((c, i) => {
        const h = (c / max) * plotH;
        const x = padL + i * band + band / 2 - barW / 2;
        const y = padT + plotH - h;
        const isToday = days[i].toDateString() === todayStr;
        return (
          <g key={i}>
            {c > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-body)">
                {c}
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, c > 0 ? 2 : 0)}
              rx="3"
              fill={isToday ? "var(--brand)" : "var(--brand-soft)"}
              stroke={isToday ? "none" : "var(--brand)"}
              strokeWidth={isToday ? 0 : 1}
            />
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="8" fill="var(--muted)" fontFamily="var(--font-body)">
              {days[i].toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
