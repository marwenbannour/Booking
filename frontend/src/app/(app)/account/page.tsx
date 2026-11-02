"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { ApiError, api, type ManagedEmployee } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function AccountPage() {
  const router = useRouter();
  const { t, setLang } = useI18n();
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
            : t("account.membersLoadFailed"),
        ),
      );
  }, [me, t]);

  function showError(reason: unknown, fallback: string) {
    setError(reason instanceof ApiError ? reason.message : fallback);
  }

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateAccount({
        email: email.trim() || null,
        phone: phone.trim() || null,
        preferredLocale: locale,
        currentPassword: profilePassword,
      });
      setProfilePassword("");
      await refreshMe();
      setMessage(t("account.saved"));
    } catch (reason) {
      showError(reason, t("account.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== passwordConfirmation) {
      setError(t("account.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      setMessage(result.message);
      await signOut();
      router.replace("/login");
    } catch (reason) {
      showError(reason, t("account.passwordChangeFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function closeAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (closeConfirmation !== "FERMER") {
      setError(t("account.closeConfirmationError"));
      return;
    }
    setBusy(true);
    try {
      await api.closeAccount(closePassword);
      await signOut();
      router.replace("/login");
    } catch (reason) {
      showError(reason, t("account.closeFailed"));
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
      setMessage(t("account.ownershipTransferred"));
    } catch (reason) {
      showError(reason, t("account.transferFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t("nav.account")} subtitle={t("account.subtitle")}>
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}
      {message && <p className="status confirmed" style={{ marginBottom: 14 }}>{message}</p>}
      <div className="dashboard-grid">
        <form className="panel stack" onSubmit={saveAccount}>
          <h2 className="t-title">{t("account.contact")}</h2>
          <Field label={t("auth.email")} name="accountEmail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Field label={t("account.phoneInternational")} name="accountPhone" type="tel" autoComplete="tel" placeholder="+21620123456" value={phone} onChange={(event) => setPhone(event.target.value)} pattern="\+[1-9]\d{7,14}" />
          <SelectField label={t("account.language")} value={locale} onChange={(value) => {
            if (value !== "fr" && value !== "ar") return;
            setLocale(value);
            setLang(value);
          }}>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </SelectField>
          <Field label={t("account.currentPasswordConfirm")} name="profilePassword" type="password" autoComplete="current-password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} minLength={12} maxLength={128} required />
          <p className="t-muted" style={{ fontSize: 11 }}>
            {t("account.emailVerificationHint")}
          </p>
          <Button type="submit" disabled={busy}>{t("account.saveContact")}</Button>
        </form>

        <form className="panel stack" onSubmit={updatePassword}>
          <h2 className="t-title">{t("account.changePassword")}</h2>
          <Field label={t("account.currentPasswordConfirm")} name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label={t("account.newPassword")} name="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label={t("account.confirmNewPassword")} name="passwordConfirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength={12} maxLength={128} required />
          <p className="t-muted" style={{ fontSize: 11 }}>{t("account.sessionsRevoked")}</p>
          <Button type="submit" disabled={busy}>{t("account.changePassword")}</Button>
        </form>

        <form className="panel stack" onSubmit={closeAccount}>
          <h2 className="t-title">{t("account.close")}</h2>
          <p className="t-muted" style={{ fontSize: 12 }}>
            {t("account.closeHint")}
          </p>
          <Field label={t("account.currentPasswordConfirm")} name="closePassword" type="password" autoComplete="current-password" value={closePassword} onChange={(event) => setClosePassword(event.target.value)} minLength={12} maxLength={128} required />
          <Field label={t("account.closeConfirmation")} name="closeConfirmation" value={closeConfirmation} onChange={(event) => setCloseConfirmation(event.target.value)} required />
          <Button type="submit" disabled={busy}>{t("account.closeAccess")}</Button>
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
                <h2 className="t-title">{t("account.transferTitle")} {establishment.name}</h2>
                <p className="t-muted" style={{ fontSize: 12 }}>
                  {t("account.transferHint")}
                </p>
                <SelectField
                  label={t("account.newOwner")}
                  value={transferTargets[establishment.id] ?? ""}
                  onChange={(value) =>
                    setTransferTargets((targets) => ({
                      ...targets,
                      [establishment.id]: value,
                    }))
                  }
                >
                  <option value="">{t("account.chooseEmployee")}</option>
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
                  {t("account.transfer")}
                </Button>
              </form>
            );
          })}
      </div>
    </AppShell>
  );
}
