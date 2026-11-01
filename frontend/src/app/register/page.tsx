"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const establishmentSlug =
      slug.trim() ||
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    try {
      await signUp({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        establishmentName: name.trim(),
        establishmentSlug,
        locale: "fr",
      });
      router.replace("/dashboard");
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : reason instanceof Error
            ? reason.message
            : "Inscription impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="auth-pane stack" onSubmit={onSubmit}>
        <div>
          <h1 className="t-h2">Créer votre espace professionnel</h1>
          <p className="t-muted" style={{ fontSize: 12 }}>
            Votre compte propriétaire et votre établissement seront créés ensemble.
          </p>
        </div>
        {error && <p className="api-error">{error}</p>}
        <Field label="Nom de l’établissement" name="establishmentName" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
        <Field label="Identifiant public" name="establishmentSlug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="généré depuis le nom" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={80} />
        <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required={!phone} />
        <Field label="Téléphone au format international" name="phone" type="tel" autoComplete="tel" placeholder="+21620123456" value={phone} onChange={(event) => setPhone(event.target.value)} required={!email} pattern="\+[1-9]\d{7,14}" />
        <Field label="Mot de passe (12 caractères minimum)" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required />
        <Button type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Création…" : "Créer mon espace"}
        </Button>
        <p className="t-muted" style={{ fontSize: 12 }}>
          Déjà inscrit ? <Link href="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
