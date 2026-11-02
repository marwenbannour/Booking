"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.requestPasswordReset(email.trim());
      setMessage(t("auth.resetRequestSent"));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : t("auth.resetRequestFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <div className="row" style={{ justifyContent: "flex-end" }}><LanguageToggle /></div>
        <div>
          <h1 className="t-h2">{t("auth.forgotTitle")}</h1>
          <p className="t-muted" style={{ fontSize: 12 }}>
            {t("auth.forgotHint")}
          </p>
        </div>
        {error && <p className="api-error">{error}</p>}
        {message && <p className="status confirmed">{message}</p>}
        <Field label={t("auth.email")} name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? t("auth.sending") : t("auth.send")}
        </Button>
        <Link href="/login">{t("auth.backToLogin")}</Link>
      </form>
    </div>
  );
}
