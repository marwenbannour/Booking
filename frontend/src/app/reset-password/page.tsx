"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setMessage(t("auth.passwordResetDone"));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : t("auth.resetFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <div className="row" style={{ justifyContent: "flex-end" }}><LanguageToggle /></div>
        <h1 className="t-h2">{t("auth.newPasswordTitle")}</h1>
        {error && <p className="api-error">{error}</p>}
        {message ? (
          <p className="status confirmed">{message} <Link href="/login">{t("auth.login")}</Link></p>
        ) : (
          <>
            <Field label={t("auth.newPassword")} name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
            <Field label={t("auth.confirmPassword")} name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required />
            <Button type="submit" disabled={busy || !token} style={{ width: "100%" }}>
              {busy ? t("auth.updatingPassword") : t("auth.updatePassword")}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
