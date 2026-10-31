"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export function ShareLink({ slug }: { slug: string | null }) {
  const { t } = useI18n();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!slug) return null;
  const url = `${origin}/book/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard refusée : l'utilisateur peut sélectionner le texte */
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="t-title">{t("share.title")}</h2>
          <p className="panel-subtitle">{t("share.hint")}</p>
        </div>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1,
            minWidth: 220,
            height: 39,
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-sunken)",
            color: "var(--ink)",
            padding: "0 11px",
            fontSize: 11,
          }}
        />
        <Button variant="quiet" onClick={copy}>
          {copied ? t("common.copied") : t("common.copy")}
        </Button>
        <a href={url} target="_blank" rel="noreferrer">
          <Button>{t("share.open")}</Button>
        </a>
      </div>
    </div>
  );
}
