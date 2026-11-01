"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function ResetPasswordPage() {
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
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.resetPassword(token, password);
      setMessage(result.message);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "La réinitialisation du mot de passe a échoué.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <h1 className="t-h2">Choisir un nouveau mot de passe</h1>
        {error && <p className="api-error">{error}</p>}
        {message ? (
          <p className="status confirmed">{message} <Link href="/login">Se connecter</Link></p>
        ) : (
          <>
            <Field label="Nouveau mot de passe (12 caractères minimum)" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
            <Field label="Confirmer le mot de passe" name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required />
            <Button type="submit" disabled={busy || !token} style={{ width: "100%" }}>
              {busy ? "Mise à jour…" : "Réinitialiser"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
