"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Clock } from "lucide-react";
import { api, ApiError, type ManagedService } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { formatPrice } from "@/lib/format";

export default function ServicesPage() {
  const { establishmentId } = useAuth();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<ManagedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    api
      .listServices(establishmentId)
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [establishmentId, t]);

  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!establishmentId) return;
    setSaving(true);
    setError(null);
    try {
      await api.createService(establishmentId, {
        name: name.trim(),
        durationMinutes: Number(duration),
        price: price ? Number(price) : undefined,
      });
      setName("");
      setDuration("30");
      setPrice("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("services.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    if (!establishmentId) return;
    try {
      await api.deactivateService(establishmentId, id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.actionFailed"));
    }
  }

  return (
    <AppShell
      title={t("nav.services")}
      subtitle={t("services.subtitle")}
      actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? t("common.back") : t("services.new")}</Button>}
    >
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {showForm && (
        <form className="panel" onSubmit={create} style={{ marginBottom: 16 }}>
          <h2 className="t-title" style={{ marginBottom: 12 }}>{t("services.new")}</h2>
          <div className="form-grid">
            <Field label={t("services.name")} value={name} onChange={(e) => setName(e.target.value)} required />
            <Field label={t("services.duration")} type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
            <Field label={t("services.priceOptional")} type="number" min={0} step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("services.create")}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="panel">
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("common.none")}</p>
        </div>
      ) : (
        <div className="entity-grid">
          {rows.map((s) => (
            <article key={s.id} className={`entity-card ${s.isActive ? "" : "inactive"}`}>
              <div className="entity-head">
                <span className="entity-ic" aria-hidden>{s.name.trim().charAt(0).toUpperCase() || "•"}</span>
                <span className={`status ${s.isActive ? "confirmed" : "cancelled"}`}>
                  {s.isActive ? t("services.active") : t("services.inactive")}
                </span>
              </div>
              <h3 className="entity-name">{s.name}</h3>
              {s.description && <p className="entity-desc">{s.description}</p>}
              <div className="entity-meta">
                <span className="dur"><Clock size={13} /> {s.durationMinutes} {t("services.minuteUnit")}</span>
                <span className="entity-price">{formatPrice(s.price, undefined, lang)}</span>
              </div>
              {s.isActive && (
                <div className="entity-foot">
                  <Button variant="text" onClick={() => deactivate(s.id)}>{t("services.deactivate")}</Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
