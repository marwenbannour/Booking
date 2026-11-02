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
      .catch((err) => setError(err instanceof ApiError ? err.message : t("common.loadFailed")))
      .finally(() => setLoading(false));
  }, [establishmentId, t]);

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
      setError(reason instanceof ApiError ? reason.message : t("employees.inviteFailed"));
    } finally {
      setInviting(false);
    }
  }

  return (
    <AppShell title={t("nav.employees")} subtitle={t("employees.subtitle")}>
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {canInvite && <form className="panel" onSubmit={submitInvitation} style={{ marginBottom: 16 }}>
        <h2 className="t-title" style={{ marginBottom: 12 }}>{t("employees.invite")}</h2>
        <div className="form-grid">
          <Field label={t("employees.displayName")} name="inviteName" value={inviteName} onChange={(event) => setInviteName(event.target.value)} minLength={2} maxLength={120} required />
          <Field label={t("employees.email")} name="inviteEmail" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} maxLength={254} required />
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <Button type="submit" disabled={inviting}>{inviting ? t("employees.creating") : t("employees.createInvitation")}</Button>
        </div>
        {inviteLink && (
          <p className="status confirmed" style={{ display: "block", overflowWrap: "anywhere", marginTop: 10 }}>
            {t("employees.invitationLink")} <a href={inviteLink}>{inviteLink}</a>
          </p>
        )}
      </form>}

      {loading ? (
        <div className="panel">
          <div className="row" style={{ justifyContent: "center", padding: 24 }}>
            <div className="spin" />
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="panel">
          <p className="t-muted" style={{ fontSize: 11, padding: "18px 0" }}>{t("common.none")}</p>
        </div>
      ) : (
        <div className="entity-grid">
          {employees.map((e) => {
            const initials = e.displayName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <article key={e.id} className={`entity-card ${e.isActive ? "" : "inactive"}`}>
                <div className="entity-head">
                  <span className="entity-ic" aria-hidden>{initials}</span>
                  <span className={`status ${e.isActive ? "confirmed" : "cancelled"}`}>
                    {e.isActive ? t("services.active") : t("services.inactive")}
                  </span>
                </div>
                <h3 className="entity-name">{e.displayName}</h3>
                <div className="entity-tags">
                  {e.services.length === 0 ? (
                    <span className="tag-chip">—</span>
                  ) : (
                    e.services.map((s) => (
                      <span key={s.serviceId} className="tag-chip">{serviceName(s.serviceId)}</span>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
