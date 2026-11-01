"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
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
      const result = await api.requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "La demande de réinitialisation a échoué.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <div>
          <h1 className="t-h2">Mot de passe oublié</h1>
          <p className="t-muted" style={{ fontSize: 12 }}>
            Saisissez l’e-mail associé à votre compte.
          </p>
        </div>
        {error && <p className="api-error">{error}</p>}
        {message && <p className="status confirmed">{message}</p>}
        <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Envoi…" : "Envoyer le lien"}
        </Button>
        <Link href="/login">Retour à la connexion</Link>
      </form>
    </div>
  );
}
