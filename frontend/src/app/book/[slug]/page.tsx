"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  type AvailabilitySlot,
  type CreateBookingResult,
  type PublicEstablishment,
  type PublicService,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { formatPrice, formatTime } from "@/lib/format";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextDays(count: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

function newIdempotencyKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `bk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function BookPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { t } = useI18n();
  const STEPS = [t("book.step.service"), t("book.step.slot"), t("book.step.details"), t("book.step.confirm")];

  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [currency, setCurrency] = useState("TND");
  const [services, setServices] = useState<PublicService[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; displayName: string }>>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [step, setStep] = useState(0);
  const [service, setService] = useState<PublicService | null>(null);
  const [employeeId, setEmployeeId] = useState<string>(""); // "" = sans préférence
  const [dateKey, setDateKey] = useState<string>(toDateKey(new Date()));
  const [slotStart, setSlotStart] = useState<string>("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);

  const [result, setResult] = useState<CreateBookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => nextDays(7), []);

  // Chargement initial : établissement + services.
  useEffect(() => {
    let active = true;
    Promise.all([api.establishment(slug), api.services(slug)])
      .then(([est, svc]) => {
        if (!active) return;
        setEstablishment(est);
        setServices(svc.services);
        setCurrency(svc.currency || est.currency);
      })
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Chargement impossible."));
    return () => {
      active = false;
    };
  }, [slug]);

  // Employés proposant le service sélectionné.
  useEffect(() => {
    if (!service) return;
    let active = true;
    api
      .employees(slug, service.id)
      .then((list) => active && setEmployees(list))
      .catch(() => active && setEmployees([]));
    return () => {
      active = false;
    };
  }, [slug, service]);

  // Disponibilités pour service + date (+ employé).
  useEffect(() => {
    if (!service || step < 1) return;
    let active = true;
    setLoadingSlots(true);
    setSlots([]);
    api
      .availability(slug, service.id, dateKey, employeeId || undefined)
      .then((res) => active && setSlots(res.slots))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : "Disponibilités indisponibles."))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [slug, service, dateKey, employeeId, step]);

  // Créneaux uniques par heure de début (pour "sans préférence").
  const uniqueSlots = useMemo(() => {
    const seen = new Set<string>();
    return slots
      .filter((s) => {
        if (seen.has(s.start)) return false;
        seen.add(s.start);
        return true;
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [slots]);

  const selectedSlot = uniqueSlots.find((s) => s.start === slotStart) ?? null;

  function pickService(s: PublicService) {
    setService(s);
    setSlotStart("");
    setStep(1);
    setError(null);
  }

  async function submit() {
    if (!service || !selectedSlot) return;
    setError(null);
    if (name.trim().length < 2) return setError("Veuillez saisir votre nom (2 caractères minimum).");
    if (phone.trim().length < 6) return setError("Veuillez saisir un numéro de téléphone valide.");

    setSubmitting(true);
    try {
      const res = await api.createBooking(
        slug,
        {
          serviceId: service.id,
          employeeId: selectedSlot.employeeId,
          startsAt: selectedSlot.start,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          consentToReminders: consent,
        },
        newIdempotencyKey(),
      );
      setResult(res);
      setStep(3);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réservation impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  const employeeName =
    employeeId ? employees.find((e) => e.id === employeeId)?.displayName ?? "—" : "Sans préférence";

  return (
    <>
      <header className="public-topbar">
        <div className="row" style={{ gap: 10 }}>
          <span className="brand-mark">HB</span>
          <strong style={{ fontFamily: "var(--font-display)" }}>
            {establishment?.name ?? "Réservation"}
          </strong>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="public-body">
        <div className="shop-banner">
          <div>
            <div className="shop-kicker">{t("book.kicker")}</div>
            <h1>{establishment?.name ?? slug}</h1>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>
              {establishment?.address ?? "Prenez rendez-vous en quelques clics."}
            </p>
          </div>
        </div>

        <div className="booking-layout">
          <div className="booking-card">
            {/* Stepper */}
            <div className="steps">
              {STEPS.map((label, i) => (
                <div key={label} style={{ display: "contents" }}>
                  <div className={`step ${i === step ? "active" : i < step ? "done" : ""}`}>
                    <span className="step-circle">{i < step ? "✓" : i + 1}</span>
                    {label}
                  </div>
                  {i < STEPS.length - 1 && <span className="step-line" />}
                </div>
              ))}
            </div>

            {error && <p className="api-error" style={{ marginBottom: 15 }}>{error}</p>}

            {/* Étape 1 — Service */}
            {step === 0 && (
              <>
                <h2 className="t-h3">{t("book.chooseService")}</h2>
                <p className="t-muted" style={{ fontSize: 10, margin: "4px 0 16px" }}>
                  Sélectionnez la prestation souhaitée.
                </p>
                <div className="service-grid">
                  {services.map((s) => (
                    <button key={s.id} className="option-tile" onClick={() => pickService(s)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 11 }}>{s.name}</strong>
                        <small>{s.durationMinutes} min</small>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{formatPrice(s.price, currency)}</span>
                    </button>
                  ))}
                  {services.length === 0 && !error && (
                    <div className="row" style={{ justifyContent: "center", padding: 24 }}>
                      <div className="spin" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Étape 2 — Créneau */}
            {step === 1 && service && (
              <>
                <h2 className="t-h3">{t("book.staffAndSlot")}</h2>
                <p className="t-label" style={{ margin: "14px 0 9px" }}>{t("book.employee")}</p>
                <div className="chip-row">
                  <button
                    className={`option-tile ${employeeId === "" ? "selected" : ""}`}
                    style={{ width: "auto" }}
                    onClick={() => setEmployeeId("")}
                  >
                    {t("book.anyEmployee")}
                  </button>
                  {employees.map((e) => (
                    <button
                      key={e.id}
                      className={`option-tile ${employeeId === e.id ? "selected" : ""}`}
                      style={{ width: "auto" }}
                      onClick={() => setEmployeeId(e.id)}
                    >
                      {e.displayName}
                    </button>
                  ))}
                </div>

                <p className="t-label" style={{ margin: "18px 0 9px" }}>{t("book.date")}</p>
                <div className="date-strip">
                  {days.map((d) => {
                    const key = toDateKey(d);
                    return (
                      <button
                        key={key}
                        className={`date-option ${dateKey === key ? "selected" : ""}`}
                        onClick={() => {
                          setDateKey(key);
                          setSlotStart("");
                        }}
                      >
                        {new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d)}
                        <strong>{d.getDate()}</strong>
                      </button>
                    );
                  })}
                </div>

                <p className="t-label" style={{ margin: "18px 0 9px" }}>{t("book.slot")}</p>
                {loadingSlots ? (
                  <div className="row" style={{ justifyContent: "center", padding: 18 }}>
                    <div className="spin" />
                  </div>
                ) : uniqueSlots.length === 0 ? (
                  <p className="t-muted" style={{ fontSize: 10 }}>{t("book.noSlots")}</p>
                ) : (
                  <div className="time-grid">
                    {uniqueSlots.map((s) => (
                      <button
                        key={s.start}
                        className={`time-option ${slotStart === s.start ? "selected" : ""}`}
                        onClick={() => setSlotStart(s.start)}
                      >
                        {formatTime(s.start, establishment?.timezone)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="booking-footer">
                  <Button variant="quiet" onClick={() => setStep(0)}>{t("common.back")}</Button>
                  <Button disabled={!slotStart} onClick={() => setStep(2)}>{t("common.continue")}</Button>
                </div>
              </>
            )}

            {/* Étape 3 — Coordonnées */}
            {step === 2 && (
              <>
                <h2 className="t-h3">{t("book.details")}</h2>
                <p className="t-muted" style={{ fontSize: 10, margin: "4px 0 16px" }}>
                  Pour confirmer le rendez-vous et vous envoyer un rappel.
                </p>
                <div className="form-grid">
                  <Field label={t("book.name")} name="name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Field label={t("book.phone")} name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Field label={t("book.email")} name="email" type="email" full value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <label className="consent-row">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>{t("book.consent")}</span>
                </label>
                <div className="booking-footer">
                  <Button variant="quiet" onClick={() => setStep(1)}>{t("common.back")}</Button>
                  <Button disabled={submitting} onClick={submit}>
                    {submitting ? t("book.booking") : t("book.confirm")}
                  </Button>
                </div>
              </>
            )}

            {/* Étape 4 — Confirmation */}
            {step === 3 && result && (
              <div className="confirmation">
                <div className="confirm-icon">✓</div>
                <h2 className="t-h2">{t("book.confirmed")}</h2>
                <p className="t-muted" style={{ fontSize: 11, margin: "8px 0" }}>
                  {t("book.confirmedHint")}
                </p>
                <div className="booking-ref">{result.booking.publicReference}</div>
                <p className="t-muted" style={{ fontSize: 11 }}>
                  {result.booking.service?.name} · {formatTime(result.booking.startsAt, establishment?.timezone)}
                  {result.booking.employee?.displayName ? ` · ${result.booking.employee.displayName}` : ""}
                </p>
              </div>
            )}
          </div>

          {/* Résumé */}
          {step > 0 && step < 3 && service && (
            <aside className="summary-card">
              <h3 className="t-title" style={{ marginBottom: 12 }}>{t("book.summary")}</h3>
              <div className="summary-row">
                <span>{t("book.step.service")}</span>
                <strong>{service.name}</strong>
              </div>
              <div className="summary-row">
                <span>{t("book.duration")}</span>
                <strong>{service.durationMinutes} min</strong>
              </div>
              <div className="summary-row">
                <span>{t("book.employee")}</span>
                <strong>{employeeName}</strong>
              </div>
              <div className="summary-row">
                <span>{t("book.slot")}</span>
                <strong>{selectedSlot ? formatTime(selectedSlot.start, establishment?.timezone) : "—"}</strong>
              </div>
              <div className="summary-row" style={{ borderBottom: 0 }}>
                <span>{t("book.price")}</span>
                <strong>{formatPrice(service.price, currency)}</strong>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
