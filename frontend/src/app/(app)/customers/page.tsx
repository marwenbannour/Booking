"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type CustomerRow } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

export default function CustomersPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (search: string, cur: string | null, append: boolean) => {
      if (!establishmentId) return;
      setLoading(true);
      setError(null);
      api
        .listCustomers(establishmentId, { q: search || undefined, cursor: cur || undefined, limit: 50 })
        .then((res) => {
          setRows((prev) => (append ? [...prev, ...res.items] : res.items));
          setCursor(res.nextCursor);
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
        .finally(() => setLoading(false));
    },
    [establishmentId],
  );

  useEffect(() => {
    load("", null, false);
  }, [load]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    load(q, null, false);
  }

  return (
    <AppShell
      title={t("nav.customers")}
      subtitle="Historique et coordonnées de vos clients"
      actions={
        <form className="row" onSubmit={onSearch} style={{ gap: 8 }}>
          <input
            placeholder={t("common.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ height: 35, border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--ink)", padding: "0 11px", fontSize: 11 }}
          />
          <Button type="submit" variant="quiet">{t("common.search")}</Button>
        </form>
      }
    >
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="panel">
        {loading && rows.length === 0 ? (
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
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Depuis</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.phoneNormalized ?? "—"}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cursor && (
          <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
            <Button variant="quiet" disabled={loading} onClick={() => load(q, cursor, true)}>
              Charger plus
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
