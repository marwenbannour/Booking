"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { ApiError, api, type ManagedEmployee } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const { me, refreshMe, signOut } = useAuth();
  const [email, setEmail] = useState(me?.email ?? "");
  const [phone, setPhone] = useState(me?.phoneNormalized ?? "");
  const [locale, setLocale] = useState<"fr" | "ar">(
    me?.preferredLocale === "ar" ? "ar" : "fr",
  );
  const [profilePassword, setProfilePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [closePassword, setClosePassword] = useState("");
  const [closeConfirmation, setCloseConfirmation] = useState("");
  const [ownerCandidates, setOwnerCandidates] = useState<
    Record<string, ManagedEmployee[]>
  >({});
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) return;
    setEmail(me.email ?? "");
    setPhone(me.phoneNormalized ?? "");
    setLocale(me.preferredLocale === "ar" ? "ar" : "fr");
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const owned = me.memberships.filter(({ role }) => role === "OWNER");
    void Promise.all(
      owned.map(async ({ establishment }) => [
        establishment.id,
        await api.listEmployees(establishment.id),
      ] as const),
    )
      .then((entries) => setOwnerCandidates(Object.fromEntries(entries)))
      .catch((reason: unknown) =>
        setError(
          reason instanceof ApiError
            ? reason.message
            : "Impossible de charger les membres pour le transfert.",
        ),
      );
  }, [me]);

  function showError(reason: unknown, fallback: string) {
    setError(reason instanceof ApiError ? reason.message : fallback);
  }

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.updateAccount({
        email: email.trim() || null,
        phone: phone.trim() || null,
        preferredLocale: locale,
        currentPassword: profilePassword,
      });
      setProfilePassword("");
      await refreshMe();
      setMessage(result.message);
    } catch (reason) {
      showError(reason, "Impossible d’enregistrer le compte.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== passwordConfirmation) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      setMessage(result.message);
      await signOut();
      router.replace("/login");
    } catch (reason) {
      showError(reason, "Impossible de modifier le mot de passe.");
    } finally {
      setBusy(false);
    }
  }

  async function closeAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (closeConfirmation !== "FERMER") {
      setError('Saisissez "FERMER" pour confirmer la fermeture du compte.');
      return;
    }
    setBusy(true);
    try {
      await api.closeAccount(closePassword);
      await signOut();
      router.replace("/login");
    } catch (reason) {
      showError(reason, "Impossible de fermer le compte.");
    } finally {
      setBusy(false);
    }
  }

  async function transferOwnership(establishmentId: string) {
    const targetMembershipId = transferTargets[establishmentId];
    if (!targetMembershipId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.transferOwnership(establishmentId, targetMembershipId);
      await refreshMe();
      setMessage("Propriété transférée. Vous pouvez maintenant fermer votre compte.");
    } catch (reason) {
      showError(reason, "Impossible de transférer la propriété.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Mon compte" subtitle="Coordonnées, sécurité et fermeture du compte">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}
      {message && <p className="status confirmed" style={{ marginBottom: 14 }}>{message}</p>}
      <div className="dashboard-grid">
        <form className="panel stack" onSubmit={saveAccount}>
          <h2 className="t-title">Coordonnées</h2>
          <Field label="Adresse e-mail" name="accountEmail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Field label="Téléphone (format international)" name="accountPhone" type="tel" autoComplete="tel" placeholder="+21620123456" value={phone} onChange={(event) => setPhone(event.target.value)} pattern="\+[1-9]\d{7,14}" />
          <SelectField label="Langue" value={locale} onChange={(value) => setLocale(value as "fr" | "ar")}>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </SelectField>
          <Field label="Mot de passe actuel (confirmation)" name="profilePassword" type="password" autoComplete="current-password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} minLength={12} maxLength={128} required />
          <p className="t-muted" style={{ fontSize: 11 }}>
            Une nouvelle adresse e-mail ne sera activée qu’après vérification du lien envoyé à cette adresse.
          </p>
          <Button type="submit" disabled={busy}>Enregistrer les coordonnées</Button>
        </form>

        <form className="panel stack" onSubmit={updatePassword}>
          <h2 className="t-title">Changer le mot de passe</h2>
          <Field label="Mot de passe actuel" name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label="Nouveau mot de passe" name="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label="Confirmer le nouveau mot de passe" name="passwordConfirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength={12} maxLength={128} required />
          <p className="t-muted" style={{ fontSize: 11 }}>Toutes les sessions seront révoquées après le changement.</p>
          <Button type="submit" disabled={busy}>Changer le mot de passe</Button>
        </form>

        <form className="panel stack" onSubmit={closeAccount}>
          <h2 className="t-title">Fermer le compte</h2>
          <p className="t-muted" style={{ fontSize: 12 }}>
            Le compte sera désactivé et les sessions révoquées. Les rendez-vous, établissements et journaux d’audit seront conservés. Transférez d’abord la propriété de tout établissement actif dont vous êtes le seul propriétaire.
          </p>
          <Field label="Mot de passe actuel" name="closePassword" type="password" autoComplete="current-password" value={closePassword} onChange={(event) => setClosePassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label={'Saisissez "FERMER" pour confirmer'} name="closeConfirmation" value={closeConfirmation} onChange={(event) => setCloseConfirmation(event.target.value)} required />
          <Button type="submit" disabled={busy}>Fermer définitivement l’accès au compte</Button>
        </form>

        {me?.memberships
          .filter(({ role, establishment }) =>
            role === "OWNER" && establishment.status === "ACTIVE",
          )
          .map(({ establishment }) => {
            const candidates = ownerCandidates[establishment.id] ?? [];
            return (
              <form
                className="panel stack"
                key={establishment.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  void transferOwnership(establishment.id);
                }}
              >
                <h2 className="t-title">Transférer la propriété · {establishment.name}</h2>
                <p className="t-muted" style={{ fontSize: 12 }}>
                  Le transfert vous attribue le rôle Manager et permet la fermeture du compte si vous le souhaitez.
                </p>
                <SelectField
                  label="Nouveau propriétaire"
                  value={transferTargets[establishment.id] ?? ""}
                  onChange={(value) =>
                    setTransferTargets((targets) => ({
                      ...targets,
                      [establishment.id]: value,
                    }))
                  }
                >
                  <option value="">Choisir un employé actif</option>
                  {candidates
                    .filter((employee) => employee.isActive)
                    .map((employee) => (
                      <option key={employee.memberId} value={employee.memberId}>
                        {employee.displayName}
                      </option>
                    ))}
                </SelectField>
                <Button
                  type="submit"
                  disabled={busy || !transferTargets[establishment.id]}
                >
                  Transférer la propriété
                </Button>
              </form>
            );
          })}
      </div>
    </AppShell>
  );
}
