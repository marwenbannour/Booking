"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError, saveTokens } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function AcceptInvitationPage() {
  const router = useRouter();
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
      setError("Le lien d’invitation est incomplet.");
      return;
    }
    if (!existingAccount && password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
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
            : "Impossible d’accepter cette invitation.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <h1 className="t-h2">Accepter l’invitation</h1>
        <p className="t-muted" style={{ fontSize: 12 }}>
          {existingAccount
            ? "Connectez-vous avec le compte invité pour rejoindre l’établissement."
            : "Choisissez un mot de passe pour créer votre compte employé."}
        </p>
        {error && <p className="api-error">{error}</p>}
        {existingAccount && (
          <Field label="E-mail ou téléphone" name="identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
        )}
        <Field label="Mot de passe" name="password" type="password" autoComplete={existingAccount ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
        {!existingAccount && (
          <Field label="Confirmer le mot de passe" name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required />
        )}
        <Button type="submit" disabled={busy || !token} style={{ width: "100%" }}>
          {busy ? "Validation…" : "Accepter l’invitation"}
        </Button>
        <Button type="button" variant="quiet" onClick={() => setExistingAccount((value) => !value)}>
          {existingAccount ? "Créer un nouveau compte" : "J’ai déjà un compte"}
        </Button>
        <Link href="/login">Retour à la connexion</Link>
      </form>
    </div>
  );
}
