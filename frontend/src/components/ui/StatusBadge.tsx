import { useI18n } from "@/lib/i18n";
import { statusClass } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const translation = t(`status.${status}`);
  return <span className={`status ${statusClass(status)}`}>{translation.startsWith("status.") ? status : translation}</span>;
}
