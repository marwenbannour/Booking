"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, ApiError, type CurrentSubscription, type SubscriptionPlan, type UsageMetric } from "@/lib/api";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/lib/format";

function UsageBar({ label, metric }: { label: string; metric: UsageMetric }) {
  const pct = metric.limit ? Math.min(100, Math.round((metric.used / metric.limit) * 100)) : 0;
  const over = metric.limit != null && metric.used >= metric.limit;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 10 }}>
        <span className="t-muted">{label}</span>
        <strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {metric.used} / {metric.limit ?? "∞"}
        </strong>
      </div>
      <div style={{ height: 6, background: "var(--line)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginTop: 5 }}>
        <div
          style={{
            width: `${metric.limit ? pct : 100}%`,
            height: "100%",
            background: over ? "var(--danger)" : "var(--brand)",
            opacity: metric.limit ? 1 : 0.25,
          }}
        />
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { establishmentId } = useAuth();
  const { t } = useI18n();
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    Promise.all([api.currentSubscription(establishmentId), api.subscriptionPlans()])
      .then(([cur, pl]) => {
        setCurrent(cur);
        setPlans(pl.items);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, [establishmentId]);

  useEffect(load, [load]);

  async function choose(plan: SubscriptionPlan) {
    if (!establishmentId) return;
    setActing(plan.code);
    setError(null);
    try {
      const hasSub = current?.subscription != null;
      if (hasSub) await api.changePlan(establishmentId, plan.code);
      else await api.subscribe(establishmentId, plan.code);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible.");
    } finally {
      setActing(null);
    }
  }

  const currentCode = current?.plan?.code;

  return (
    <AppShell title={t("nav.subscriptions")} subtitle="Formule, quotas et facturation">
      {error && <p className="api-error" style={{ marginBottom: 14 }}>{error}</p>}

      {loading ? (
        <div className="row" style={{ justifyContent: "center", padding: 24 }}>
          <div className="spin" />
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(260px,.9fr)", gap: 16, marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h2 className="t-title">Formule actuelle</h2>
                  <p className="panel-subtitle">
                    {current?.plan?.name ?? "Gratuit"}
                    {current?.plan?.isImplicitFree ? " (implicite)" : ""}
                  </p>
                </div>
                {current?.subscription && <StatusBadge status={current.subscription.status} />}
              </div>
              {current && (
                <>
                  <UsageBar label="Employés actifs" metric={current.usage.employees} />
                  <UsageBar label="Rendez-vous ce mois" metric={current.usage.bookings} />
                  <UsageBar label="Notifications ce mois" metric={current.usage.notifications} />
                </>
              )}
            </div>

            <div className="panel">
              <h2 className="t-title" style={{ marginBottom: 12 }}>Période</h2>
              {current?.subscription ? (
                <>
                  <div className="summary-row"><span>Début</span><strong>{new Date(current.subscription.currentPeriodStart).toLocaleDateString("fr-FR")}</strong></div>
                  <div className="summary-row"><span>Fin</span><strong>{new Date(current.subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}</strong></div>
                  {current.subscription.trialEndsAt && (
                    <div className="summary-row"><span>Fin d&apos;essai</span><strong>{new Date(current.subscription.trialEndsAt).toLocaleDateString("fr-FR")}</strong></div>
                  )}
                  <div className="summary-row" style={{ borderBottom: 0 }}><span>Renouvellement</span><strong>{current.subscription.cancelAtPeriodEnd ? "Non" : "Automatique"}</strong></div>
                </>
              ) : (
                <p className="t-muted" style={{ fontSize: 11 }}>Aucun abonnement actif — formule gratuite appliquée.</p>
              )}
            </div>
          </div>

          <div className="panel">
            <h2 className="t-title" style={{ marginBottom: 14 }}>Formules disponibles</h2>
            <div className="metrics-grid" style={{ marginBottom: 0 }}>
              {plans.map((p) => {
                const isCurrent = p.code === currentCode;
                return (
                  <div className="card" key={p.id} style={{ padding: 17 }}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <strong className="t-title">{p.name}</strong>
                      {isCurrent && <span className="status confirmed">Actuel</span>}
                    </div>
                    <div className="t-metric" style={{ margin: "10px 0 2px" }}>
                      {formatPrice(p.priceAmount, p.currency)}
                    </div>
                    <p className="t-muted" style={{ fontSize: 9 }}>
                      / {p.interval === "YEAR" ? "an" : "mois"}
                      {p.trialDays > 0 ? ` · ${p.trialDays} j d'essai` : ""}
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "grid", gap: 5, fontSize: 10 }}>
                      <li className="t-muted">Employés : {p.maxEmployees ?? "illimité"}</li>
                      <li className="t-muted">Rendez-vous/mois : {p.maxBookingsPerMonth ?? "illimité"}</li>
                      <li className="t-muted">Notifications/mois : {p.maxNotificationsPerMonth ?? "illimité"}</li>
                    </ul>
                    <Button
                      variant={isCurrent ? "quiet" : "primary"}
                      disabled={isCurrent || acting === p.code}
                      onClick={() => choose(p)}
                      style={{ width: "100%" }}
                    >
                      {isCurrent ? "Plan actuel" : current?.subscription ? "Changer" : "Souscrire"}
                    </Button>
                  </div>
                );
              })}
              {plans.length === 0 && <p className="t-muted" style={{ fontSize: 11 }}>{t("common.none")}</p>}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
