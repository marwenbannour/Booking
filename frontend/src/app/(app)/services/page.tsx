"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type ManagedService } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { formatPrice } from "@/lib/format";

export default function ServicesPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
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
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

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
      setError(err instanceof ApiError ? err.message : "Création impossible.");
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
      setError(err instanceof ApiError ? err.message : "Action impossible.");
    }
  }

  return (
    <AppShell
      title={t("nav.services")}
      subtitle="Prestations proposées à la réservation"
      actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? t("common.back") : "Nouveau service"}</Button>}
    >
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {showForm && (
        <form className="panel" onSubmit={create} style={{ marginBottom: 16 }}>
          <h2 className="t-title" style={{ marginBottom: 12 }}>Nouveau service</h2>
          <div className="form-grid">
            <Field label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field label="Durée (min)" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
            <Field label="Prix (optionnel)" type="number" min={0} step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Créer le service"}</Button>
          </div>
        </form>
      )}

      <div className="panel">
        {loading ? (
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("common.none")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Durée</th>
                  <th>Prix</th>
                  <th>État</th>
                  <th style={{ textAlign: "end" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.55 }}>
                    <td>
                      <strong>{s.name}</strong>
                      {s.description && <div className="t-muted" style={{ fontSize: 8 }}>{s.description}</div>}
                    </td>
                    <td>{s.durationMinutes} min</td>
                    <td>{formatPrice(s.price)}</td>
                    <td>
                      <span className={`status ${s.isActive ? "confirmed" : "cancelled"}`}>
                        {s.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ textAlign: "end" }}>
                      {s.isActive && (
                        <Button variant="text" onClick={() => deactivate(s.id)}>Désactiver</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
