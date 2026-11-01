"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type ManagedEmployee, type ManagedService } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function EmployeesPage() {
  const { establishmentId, me } = useAuth();
  const { t } = useI18n();
  const [employees, setEmployees] = useState<ManagedEmployee[]>([]);
  const [services, setServices] = useState<ManagedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

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
  const canInvite = me?.memberships.some(
    (membership) =>
      membership.establishment.id === establishmentId &&
      ["OWNER", "MANAGER"].includes(membership.role),
  );

  async function submitInvitation(event: React.FormEvent) {
    event.preventDefault();
    if (!establishmentId) return;
    setInviting(true);
    setError(null);
    setInviteLink(null);
    try {
      const invitation = await api.inviteEmployee(establishmentId, {
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
      });
      setInviteLink(
        `${window.location.origin}/accept-invitation?token=${encodeURIComponent(invitation.invitationToken)}`,
      );
      setInviteName("");
      setInviteEmail("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Invitation impossible.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <AppShell title={t("nav.employees")} subtitle="Équipe et prestations assignées">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {canInvite && <form className="panel" onSubmit={submitInvitation} style={{ marginBottom: 16 }}>
        <h2 className="t-title" style={{ marginBottom: 12 }}>Inviter un employé</h2>
        <div className="form-grid">
          <Field label="Nom affiché" name="inviteName" value={inviteName} onChange={(event) => setInviteName(event.target.value)} minLength={2} maxLength={120} required />
          <Field label="Adresse e-mail" name="inviteEmail" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} maxLength={254} required />
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <Button type="submit" disabled={inviting}>{inviting ? "Création…" : "Créer l’invitation"}</Button>
        </div>
        {inviteLink && (
          <p className="status confirmed" style={{ display: "block", overflowWrap: "anywhere", marginTop: 10 }}>
            Lien à transmettre à l’employé : <a href={inviteLink}>{inviteLink}</a>
          </p>
        )}
      </form>}

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
