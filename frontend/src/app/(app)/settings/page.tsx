"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  api,
  ApiError,
  type EstablishmentProfile,
  type NotificationSettings,
} from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row" style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--brand)", width: 18, height: 18 }} />
    </label>
  );
}

export default function SettingsPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<EstablishmentProfile | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [savingP, setSavingP] = useState(false);
  const [savingN, setSavingN] = useState(false);

  useEffect(() => {
    if (!establishmentId) return;
    setLoading(true);
    Promise.all([api.establishmentProfile(establishmentId), api.notificationSettings(establishmentId)])
      .then(([p, s]) => {
        setProfile(p);
        setSettings(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

  function patchProfile(patch: Partial<EstablishmentProfile>) {
    setProfile((p) => (p ? { ...p, ...patch } : p));
  }
  function patchSettings(patch: Partial<NotificationSettings>) {
    setSettings((s) => (s ? { ...s, ...patch } : s));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!establishmentId || !profile) return;
    setSavingP(true);
    setError(null);
    setMsg(null);
    try {
      await api.updateEstablishment(establishmentId, {
        name: profile.name,
        description: profile.description ?? null,
        address: profile.address ?? null,
        timezone: profile.timezone,
        currency: profile.currency,
        minimumBookingNoticeMinutes: profile.minimumBookingNoticeMinutes,
        maximumBookingDays: profile.maximumBookingDays,
        cancellationNoticeHours: profile.cancellationNoticeHours,
      });
      setMsg("Profil de l'établissement enregistré.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSavingP(false);
    }
  }

  async function saveSettings() {
    if (!establishmentId || !settings) return;
    setSavingN(true);
    setError(null);
    setMsg(null);
    try {
      const saved = await api.updateNotificationSettings(establishmentId, {
        whatsappEnabled: settings.whatsappEnabled,
        confirmationEnabled: settings.confirmationEnabled,
        cancellationEnabled: settings.cancellationEnabled,
        firstReminderMinutesBefore: settings.firstReminderMinutesBefore,
        secondReminderMinutesBefore: settings.secondReminderMinutesBefore,
      });
      setSettings(saved);
      setMsg("Paramètres de notification enregistrés.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSavingN(false);
    }
  }

  return (
    <AppShell title={t("nav.settings")} subtitle="Profil de l'établissement et rappels WhatsApp">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}
      {msg && (
        <p style={{ marginBottom: 14 }}>
          <span className="status confirmed">{msg}</span>
        </p>
      )}

      {loading ? (
        <div className="row" style={{ justifyContent: "center", padding: 24 }}>
          <div className="spin" />
        </div>
      ) : (
        <div className="dashboard-grid">
          {profile && (
            <form className="panel" onSubmit={saveProfile}>
              <h2 className="t-title" style={{ marginBottom: 14 }}>Établissement</h2>
              <div className="form-grid">
                <Field label="Nom" value={profile.name} onChange={(e) => patchProfile({ name: e.target.value })} />
                <Field label="Adresse" value={profile.address ?? ""} onChange={(e) => patchProfile({ address: e.target.value })} />
                <Field label="Fuseau horaire" value={profile.timezone} onChange={(e) => patchProfile({ timezone: e.target.value })} />
                <Field label="Devise" value={profile.currency} onChange={(e) => patchProfile({ currency: e.target.value.toUpperCase() })} maxLength={3} />
                <Field label="Préavis min. (min)" type="number" min={0} value={String(profile.minimumBookingNoticeMinutes)} onChange={(e) => patchProfile({ minimumBookingNoticeMinutes: Number(e.target.value) })} />
                <Field label="Horizon max. (jours)" type="number" min={1} value={String(profile.maximumBookingDays)} onChange={(e) => patchProfile({ maximumBookingDays: Number(e.target.value) })} />
                <Field label="Préavis annulation (h)" type="number" min={0} value={String(profile.cancellationNoticeHours)} onChange={(e) => patchProfile({ cancellationNoticeHours: Number(e.target.value) })} />
                <div className="field full">
                  <label htmlFor="desc">Description</label>
                  <input id="desc" value={profile.description ?? ""} onChange={(e) => patchProfile({ description: e.target.value })} />
                </div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
                <Button type="submit" disabled={savingP}>{savingP ? "Enregistrement…" : "Enregistrer"}</Button>
              </div>
            </form>
          )}

          {settings && (
            <div className="panel">
              <h2 className="t-title" style={{ marginBottom: 6 }}>Rappels WhatsApp</h2>
              <Toggle label="Activer WhatsApp" checked={settings.whatsappEnabled} onChange={(v) => patchSettings({ whatsappEnabled: v })} />
              <Toggle label="Message de confirmation" checked={settings.confirmationEnabled} onChange={(v) => patchSettings({ confirmationEnabled: v })} />
              <Toggle label="Message d'annulation" checked={settings.cancellationEnabled} onChange={(v) => patchSettings({ cancellationEnabled: v })} />

              <div className="form-grid" style={{ marginTop: 14 }}>
                <Field
                  label="1er rappel (min avant)"
                  type="number"
                  min={1}
                  value={settings.firstReminderMinutesBefore == null ? "" : String(settings.firstReminderMinutesBefore)}
                  onChange={(e) => patchSettings({ firstReminderMinutesBefore: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <Field
                  label="2e rappel (min avant)"
                  type="number"
                  min={1}
                  value={settings.secondReminderMinutesBefore == null ? "" : String(settings.secondReminderMinutesBefore)}
                  onChange={(e) => patchSettings({ secondReminderMinutesBefore: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
              <p className="t-muted" style={{ fontSize: 11, marginTop: 8 }}>Laisser vide pour désactiver un rappel.</p>

              <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
                <Button disabled={savingN} onClick={saveSettings}>{savingN ? "Enregistrement…" : "Enregistrer"}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
