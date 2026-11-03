"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type CustomerRow } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "•"
  );
}

export default function CustomersPage() {
  const { establishmentId } = useAuth();
  const { t, lang } = useI18n();
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
        .catch((err) => setError(err instanceof ApiError ? err.message : t("common.loadFailed")))
        .finally(() => setLoading(false));
    },
    [establishmentId, t],
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
      subtitle={t("customers.subtitle")}
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
                  <th>{t("customers.client")}</th>
                  <th>{t("customers.phone")}</th>
                  <th>{t("customers.email")}</th>
                  <th>{t("customers.since")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-user">
                        <span className="ava" aria-hidden>{initials(c.name)}</span>
                        <div className="nm"><strong>{c.name}</strong></div>
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{c.phoneNormalized ?? "—"}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>{formatDate(c.createdAt, undefined, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cursor && (
          <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
            <Button variant="quiet" disabled={loading} onClick={() => load(q, cursor, true)}>
              {t("common.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
