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
      .catch((err) => setError(err instanceof ApiError ? err.message : t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [establishmentId, t]);

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
      setMsg(t("settings.savedProfile"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.saveFailed"));
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
      setMsg(t("settings.savedNotifications"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.saveFailed"));
    } finally {
      setSavingN(false);
    }
  }

  return (
    <AppShell title={t("nav.settings")} subtitle={t("settings.subtitle")}>
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
              <h2 className="t-title" style={{ marginBottom: 14 }}>{t("settings.establishment")}</h2>
              <div className="form-grid">
                <Field label={t("settings.name")} value={profile.name} onChange={(e) => patchProfile({ name: e.target.value })} />
                <Field label={t("settings.address")} value={profile.address ?? ""} onChange={(e) => patchProfile({ address: e.target.value })} />
                <Field label={t("settings.timezone")} value={profile.timezone} onChange={(e) => patchProfile({ timezone: e.target.value })} />
                <Field label={t("settings.currency")} value={profile.currency} onChange={(e) => patchProfile({ currency: e.target.value.toUpperCase() })} maxLength={3} />
                <Field label={t("settings.minimumNotice")} type="number" min={0} value={String(profile.minimumBookingNoticeMinutes)} onChange={(e) => patchProfile({ minimumBookingNoticeMinutes: Number(e.target.value) })} />
                <Field label={t("settings.maximumHorizon")} type="number" min={1} value={String(profile.maximumBookingDays)} onChange={(e) => patchProfile({ maximumBookingDays: Number(e.target.value) })} />
                <Field label={t("settings.cancellationNotice")} type="number" min={0} value={String(profile.cancellationNoticeHours)} onChange={(e) => patchProfile({ cancellationNoticeHours: Number(e.target.value) })} />
                <div className="field full">
                  <label htmlFor="desc">{t("settings.description")}</label>
                  <input id="desc" value={profile.description ?? ""} onChange={(e) => patchProfile({ description: e.target.value })} />
                </div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
                <Button type="submit" disabled={savingP}>{savingP ? t("common.saving") : t("common.save")}</Button>
              </div>
            </form>
          )}

          {settings && (
            <div className="panel">
              <h2 className="t-title" style={{ marginBottom: 6 }}>{t("settings.whatsapp")}</h2>
              <Toggle label={t("settings.enableWhatsapp")} checked={settings.whatsappEnabled} onChange={(v) => patchSettings({ whatsappEnabled: v })} />
              <Toggle label={t("settings.confirmation")} checked={settings.confirmationEnabled} onChange={(v) => patchSettings({ confirmationEnabled: v })} />
              <Toggle label={t("settings.cancellation")} checked={settings.cancellationEnabled} onChange={(v) => patchSettings({ cancellationEnabled: v })} />

              <div className="form-grid" style={{ marginTop: 14 }}>
                <Field
                  label={t("settings.firstReminder")}
                  type="number"
                  min={1}
                  value={settings.firstReminderMinutesBefore == null ? "" : String(settings.firstReminderMinutesBefore)}
                  onChange={(e) => patchSettings({ firstReminderMinutesBefore: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <Field
                  label={t("settings.secondReminder")}
                  type="number"
                  min={1}
                  value={settings.secondReminderMinutesBefore == null ? "" : String(settings.secondReminderMinutesBefore)}
                  onChange={(e) => patchSettings({ secondReminderMinutesBefore: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
              <p className="t-muted" style={{ fontSize: 11, marginTop: 8 }}>{t("settings.disableReminderHint")}</p>

              <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
                <Button disabled={savingN} onClick={saveSettings}>{savingN ? t("common.saving") : t("common.save")}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
