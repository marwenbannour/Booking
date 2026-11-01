"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Vérification en cours…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("Le lien de vérification est incomplet.");
      return;
    }
    void api
      .verifyEmail(token)
      .then((result) => setMessage(result.message))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Vérification impossible."),
      );
  }, []);

  return (
    <div className="center-screen">
      <div className="auth-pane stack">
        <h1 className="t-h2">Vérification de l’adresse e-mail</h1>
        {error ? <p className="api-error">{error}</p> : <p>{message}</p>}
        <Link href="/login">Retour à la connexion</Link>
      </div>
    </div>
  );
}
