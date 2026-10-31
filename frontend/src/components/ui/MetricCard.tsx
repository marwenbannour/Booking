import type { ReactNode } from "react";

type Tone = "brand" | "teal" | "orange" | "rose";

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { direction: "up" | "down"; value: string; caption?: string };
}

export function MetricCard({ label, value, icon, tone = "brand", trend }: Props) {
  return (
    <div className="metric-card">
      <div className="metric-head">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`} aria-hidden>
          {icon ?? "•"}
        </span>
      </div>
      <div className="t-metric metric-value">{value}</div>
      {trend && (
        <div className="metric-foot">
          <span className={trend.direction === "up" ? "trend-up" : "trend-down"}>
            {trend.direction === "up" ? "▲" : "▼"} {trend.value}
          </span>
          {trend.caption && <span>{trend.caption}</span>}
        </div>
      )}
    </div>
  );
}
