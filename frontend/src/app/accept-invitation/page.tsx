"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError, saveTokens } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { signIn, refreshMe } = useAuth();
  const [token, setToken] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError(t("auth.invitationIncomplete"));
      return;
    }
    if (!existingAccount && password !== confirmation) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      if (existingAccount) {
        await signIn(identifier.trim(), password);
        await api.acceptExistingEmployeeInvitation(token);
      } else {
        const result = await api.acceptEmployeeInvitation(token, password);
        saveTokens(result);
        await refreshMe();
      }
      router.replace("/dashboard");
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : reason instanceof Error
            ? reason.message
            : t("auth.invitationFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <div className="row" style={{ justifyContent: "flex-end" }}><LanguageToggle /></div>
        <h1 className="t-h2">{t("auth.invitationTitle")}</h1>
        <p className="t-muted" style={{ fontSize: 12 }}>
          {existingAccount
            ? t("auth.invitationExistingHint")
            : t("auth.invitationNewHint")}
        </p>
        {error && <p className="api-error">{error}</p>}
        {existingAccount && (
          <Field label={t("auth.identifier")} name="identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
        )}
        <Field label={t("auth.password")} name="password" type="password" autoComplete={existingAccount ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
        {!existingAccount && (
          <Field label={t("auth.confirmPassword")} name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required />
        )}
        <Button type="submit" disabled={busy || !token} style={{ width: "100%" }}>
          {busy ? t("auth.invitationValidating") : t("auth.acceptInvitation")}
        </Button>
        <Button type="button" variant="quiet" onClick={() => setExistingAccount((value) => !value)}>
          {existingAccount ? t("auth.createNewAccount") : t("auth.haveAccount")}
        </Button>
        <Link href="/login">{t("auth.backToLogin")}</Link>
      </form>
    </div>
  );
}
