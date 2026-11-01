"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="auth-split">
        <form className="auth-pane stack" onSubmit={onSubmit}>
        <div className="row" style={{ gap: 11, marginBottom: 6 }}>
          <span className="brand-mark">B&amp;W</span>
          <span className="brand-name">
            Book<span>&amp;Whats</span>
          </span>
        </div>
        <div>
          <h1 className="t-h2">Connexion à l&apos;espace pro</h1>
          <p className="t-muted" style={{ fontSize: 11, marginTop: 6 }}>
            Gérez vos rendez-vous, clients et rappels WhatsApp.
          </p>
        </div>

        {(error || authError) && <p className="api-error">{error ?? authError}</p>}

        <Field
          label="Email ou téléphone"
          name="identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" disabled={busy} style={{ width: "100%", padding: "12px 14px" }}>
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
        <div className="row" style={{ justifyContent: "space-between", fontSize: 11 }}>
          <a href="/forgot-password">Mot de passe oublié ?</a>
          <a href="/register">Créer un compte professionnel</a>
        </div>
        </form>

        <aside className="auth-visual">
          <div className="auth-visual-brand">
            <span className="brand-mark" style={{ background: "rgba(255,255,255,.18)", boxShadow: "none" }}>B&amp;W</span>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Book&amp;Whats</strong>
          </div>
          <div style={{ marginTop: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.25, margin: 0 }}>
              Gérez vos rendez-vous en toute simplicité
            </h2>
            <p style={{ opacity: 0.92, fontSize: 13, marginTop: 8 }}>Réservez. Organisez. Ne ratez plus.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
