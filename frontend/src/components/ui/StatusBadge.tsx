import { STATUS_LABELS, statusClass } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status ${statusClass(status)}`}>{STATUS_LABELS[status] ?? status}</span>;
}
