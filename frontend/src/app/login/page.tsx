"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { ready, me, authError, signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && me) router.replace("/dashboard");
  }, [ready, me, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(identifier.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="auth-split">
        <form className="auth-pane stack" onSubmit={onSubmit}>
        <div className="row" style={{ justifyContent: "flex-end" }}><LanguageToggle /></div>
        <div className="row" style={{ gap: 11, marginBottom: 6 }}>
          <span className="brand-mark">B+</span>
          <span className="brand-name">
            Booking<span>+</span>
          </span>
        </div>
        <div>
          <h1 className="t-h2">{t("auth.loginTitle")}</h1>
          <p className="t-muted" style={{ fontSize: 11, marginTop: 6 }}>
            {t("auth.loginHint")}
          </p>
        </div>

        {(error || authError) && <p className="api-error">{error ?? authError}</p>}

        <Field
          label={t("auth.identifier")}
          name="identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" disabled={busy} style={{ width: "100%", padding: "12px 14px" }}>
          {busy ? t("auth.loggingIn") : t("auth.login")}
        </Button>
        <div className="row" style={{ justifyContent: "space-between", fontSize: 11 }}>
          <a href="/forgot-password">{t("auth.forgotPassword")}</a>
          <a href="/register">{t("auth.createProfessional")}</a>
        </div>
        </form>

        <aside className="auth-visual">
          <div className="auth-visual-brand">
            <span className="brand-mark" style={{ background: "rgba(255,255,255,.18)", boxShadow: "none" }}>B+</span>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Booking+</strong>
          </div>
          <div style={{ marginTop: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.25, margin: 0 }}>
              {t("auth.brandHeadline")}
            </h2>
            <p style={{ opacity: 0.92, fontSize: 13, marginTop: 8 }}>{t("auth.brandTagline")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
