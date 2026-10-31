"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type ManagedEmployee, type ManagedService } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";

export default function EmployeesPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [employees, setEmployees] = useState<ManagedEmployee[]>([]);
  const [services, setServices] = useState<ManagedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!establishmentId) return;
    setLoading(true);
    Promise.all([api.listEmployees(establishmentId), api.listServices(establishmentId)])
      .then(([emp, svc]) => {
        setEmployees(emp);
        setServices(svc);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

  const serviceName = useMemo(() => {
    const map = new Map(services.map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [services]);

  return (
    <AppShell title={t("nav.employees")} subtitle="Équipe et prestations assignées">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="panel">
        {loading ? (
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        ) : employees.length === 0 ? (
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("common.none")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Services</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const initials = e.displayName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <tr key={e.id} style={{ opacity: e.isActive ? 1 : 0.55 }}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <span className="avatar teal" style={{ width: 29, height: 29, fontSize: 9 }}>{initials}</span>
                          <strong>{e.displayName}</strong>
                        </div>
                      </td>
                      <td>
                        {e.services.length === 0
                          ? "—"
                          : e.services.map((s) => serviceName(s.serviceId)).join(", ")}
                      </td>
                      <td>
                        <span className={`status ${e.isActive ? "confirmed" : "cancelled"}`}>
                          {e.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
