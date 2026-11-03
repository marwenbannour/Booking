"use client";

import { useI18n } from "@/lib/i18n";

/** Panneau latéral bleu nuit partagé par les pages d'authentification. */
export function AuthVisual() {
  const { t } = useI18n();
  return (
    <aside className="auth-visual">
      <div className="auth-visual-brand">
        <span className="brand-mark" style={{ background: "rgba(255,255,255,.18)", boxShadow: "none" }}>
          B+
        </span>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Booking+</strong>
      </div>
      <div style={{ marginTop: "auto" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.25, margin: 0 }}>
          {t("auth.brandHeadline")}
        </h2>
        <p style={{ opacity: 0.92, fontSize: 13, marginTop: 8 }}>{t("auth.brandTagline")}</p>
      </div>
    </aside>
  );
}
