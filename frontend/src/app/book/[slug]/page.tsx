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
  const { t, lang } = useI18n();
  const STEPS = [
    t("book.step.service"),
    t("book.step.slot"),
    t("book.step.details"),
    t("book.step.confirm"),
  ];

  const [establishment, setEstablishment] =
    useState<PublicEstablishment | null>(null);
  const [currency, setCurrency] = useState("TND");
  const [services, setServices] = useState<PublicService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [employees, setEmployees] = useState<
    Array<{ id: string; displayName: string }>
  >([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [step, setStep] = useState(0);
  const [service, setService] = useState<PublicService | null>(null);
  const [employeeId, setEmployeeId] = useState<string>(""); // "" = sans préférence
  const [dateKey, setDateKey] = useState<string>(toDateKey(new Date()));
  const [slotStart, setSlotStart] = useState<string>("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const [result, setResult] = useState<CreateBookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(toDateKey(new Date()));
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>(
    [],
  );
  const [rescheduleSlotStart, setRescheduleSlotStart] = useState("");
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleRequested, setRescheduleRequested] = useState(false);

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
      .catch(
        (err) =>
          active &&
          setError(
            err instanceof ApiError ? err.message : t("common.loadFailed"),
          ),
      )
      .finally(() => active && setLoadingServices(false));
    return () => {
      active = false;
    };
  }, [slug, t]);

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
      .catch(
        (err) =>
          active &&
          setError(
            err instanceof ApiError ? err.message : t("book.errorAvailability"),
          ),
      )
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [slug, service, dateKey, employeeId, step, t]);

  useEffect(() => {
    if (!rescheduleMode || !service || !result) return;
    let active = true;
    setLoadingRescheduleSlots(true);
    setRescheduleSlots([]);
    setRescheduleSlotStart("");
    api
      .availability(slug, service.id, rescheduleDate, employeeId || undefined)
      .then((res) => active && setRescheduleSlots(res.slots))
      .catch(
        (err) =>
          active &&
          setError(
            err instanceof ApiError ? err.message : t("book.errorAvailability"),
          ),
      )
      .finally(() => active && setLoadingRescheduleSlots(false));
    return () => {
      active = false;
    };
  }, [slug, service, rescheduleDate, employeeId, rescheduleMode, result, t]);

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

  // Créneaux groupés Matin / Après-midi (heure locale de l'établissement).
  const groupedSlots = useMemo(() => {
    const tz = establishment?.timezone;
    const hourOf = (iso: string): number => {
      const part = new Intl.DateTimeFormat("fr-FR", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: tz,
      })
        .formatToParts(new Date(iso))
        .find((p) => p.type === "hour");
      return part ? parseInt(part.value, 10) : 0;
    };
    return {
      morning: uniqueSlots.filter((s) => hourOf(s.start) < 12),
      afternoon: uniqueSlots.filter((s) => hourOf(s.start) >= 12),
    };
  }, [uniqueSlots, establishment?.timezone]);

  const uniqueRescheduleSlots = useMemo(() => {
    const seen = new Set<string>();
    return rescheduleSlots
      .filter((slot) => {
        if (seen.has(slot.start)) return false;
        seen.add(slot.start);
        return true;
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [rescheduleSlots]);
  const selectedRescheduleSlot =
    uniqueRescheduleSlots.find((slot) => slot.start === rescheduleSlotStart) ??
    null;

  function pickService(s: PublicService) {
    setService(s);
    setSlotStart("");
    setStep(1);
    setError(null);
  }

  async function submit() {
    if (!service || !selectedSlot) return;
    setError(null);
    if (name.trim().length < 2) return setError(t("book.errorName"));
    if (phone.trim().length < 6) return setError(t("book.errorPhone"));

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
          locale: lang,
        },
        newIdempotencyKey(),
      );
      setResult(res);
      setStep(3);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("book.errorBooking"));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRescheduleRequest() {
    if (!result || !selectedRescheduleSlot) return;
    setError(null);
    setSubmittingReschedule(true);
    try {
      await api.requestReschedule(
        result.booking.id,
        result.customerAccessToken,
        selectedRescheduleSlot.start,
        selectedRescheduleSlot.employeeId,
      );
      setRescheduleRequested(true);
      setRescheduleMode(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("book.rescheduleFailed"),
      );
    } finally {
      setSubmittingReschedule(false);
    }
  }

  const employeeName = employeeId
    ? (employees.find((e) => e.id === employeeId)?.displayName ?? "—")
    : t("book.anyEmployee");

  return (
    <>
      <header className="public-topbar">
        <div className="row" style={{ gap: 10 }}>
          <span className="brand-mark">B+</span>
          <strong style={{ fontFamily: "var(--font-display)" }}>
            {establishment?.name ?? t("book.defaultTitle")}
          </strong>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="public-body">
        <div className="shop-banner">
          <div>
            <div className="shop-kicker">{t("book.kicker")}</div>
            <h1>{establishment?.name ?? slug}</h1>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>
              {establishment?.address ?? t("book.defaultAddress")}
            </p>
          </div>
        </div>

        <div className="booking-layout">
          <div className="booking-card">
            {/* Stepper */}
            <div
              className="steps"
              role="progressbar"
              aria-label={`${STEPS[step]} — ${t("book.stepProgress")
                .replace("{current}", String(step + 1))
                .replace("{total}", String(STEPS.length))}`}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={step + 1}
            >
              {STEPS.map((label, i) => (
                <div key={label} style={{ display: "contents" }}>
                  <div
                    className={`step ${i === step ? "active" : i < step ? "done" : ""}`}
                    aria-current={i === step ? "step" : undefined}
                  >
                    <span className="step-circle" aria-hidden="true">
                      {i < step ? "✓" : i + 1}
                    </span>
                    <span className="step-label">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <span className="step-line" />}
                </div>
              ))}
            </div>

            {error && (
              <p
                className="api-error"
                role="alert"
                style={{ marginBottom: 15 }}
              >
                {error}
              </p>
            )}

            {/* Étape 1 — Service */}
            {step === 0 && (
              <>
                <h2 className="t-h3">{t("book.chooseService")}</h2>
                <p
                  className="t-muted"
                  style={{ fontSize: 10, margin: "4px 0 16px" }}
                >
                  {t("book.serviceHint")}
                </p>
                <div className="service-grid">
                  {loadingServices ? (
                    <div
                      className="row"
                      style={{ justifyContent: "center", padding: 24 }}
                    >
                      <div
                        className="spin"
                        role="status"
                        aria-label={t("common.loading")}
                      />
                    </div>
                  ) : services.length === 0 ? (
                    <p className="t-muted booking-empty">
                      {t("book.noServices")}
                    </p>
                  ) : (
                    services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`option-tile ${service?.id === s.id ? "selected" : ""}`}
                        aria-pressed={service?.id === s.id}
                        onClick={() => pickService(s)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 11 }}>{s.name}</strong>
                          <small>
                            {s.durationMinutes} {t("book.minuteUnit")}
                          </small>
                        </div>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {service?.id === s.id && (
                            <span
                              aria-hidden="true"
                              style={{
                                color: "var(--success)",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              ✓
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700 }}>
                            {formatPrice(s.price, currency, lang)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Étape 2 — Créneau */}
            {step === 1 && service && (
              <>
                <h2 className="t-h3">{t("book.staffAndSlot")}</h2>
                <p className="t-label" style={{ margin: "14px 0 9px" }}>
                  {t("book.employee")}
                </p>
                <div className="chip-row">
                  <button
                    type="button"
                    className={`option-tile ${employeeId === "" ? "selected" : ""}`}
                    style={{ width: "auto" }}
                    aria-pressed={employeeId === ""}
                    onClick={() => setEmployeeId("")}
                  >
                    {t("book.anyEmployee")}
                  </button>
                  {employees.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className={`option-tile ${employeeId === e.id ? "selected" : ""}`}
                      style={{ width: "auto" }}
                      aria-pressed={employeeId === e.id}
                      onClick={() => setEmployeeId(e.id)}
                    >
                      {e.displayName}
                    </button>
                  ))}
                </div>

                <p className="t-label" style={{ margin: "18px 0 9px" }}>
                  {t("book.date")}
                </p>
                <div className="date-strip">
                  {days.map((d) => {
                    const key = toDateKey(d);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`date-option ${dateKey === key ? "selected" : ""}`}
                        aria-pressed={dateKey === key}
                        onClick={() => {
                          setDateKey(key);
                          setSlotStart("");
                        }}
                      >
                        {new Intl.DateTimeFormat(
                          lang === "ar" ? "ar-TN" : "fr-FR",
                          { weekday: "short" },
                        ).format(d)}
                        <strong>{d.getDate()}</strong>
                      </button>
                    );
                  })}
                </div>

                <p className="t-label" style={{ margin: "18px 0 9px" }}>
                  {t("book.slot")}
                </p>
                {loadingSlots ? (
                  <div
                    className="row"
                    style={{ justifyContent: "center", padding: 18 }}
                  >
                    <div className="spin" />
                  </div>
                ) : uniqueSlots.length === 0 ? (
                  <p className="t-muted" style={{ fontSize: 10 }}>
                    {t("book.noSlots")}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    {(
                      [
                        ["book.morning", groupedSlots.morning],
                        ["book.afternoon", groupedSlots.afternoon],
                      ] as const
                    ).map(([labelKey, list]) =>
                      list.length === 0 ? null : (
                        <div key={labelKey}>
                          <p
                            className="t-label"
                            style={{ margin: "0 0 8px", opacity: 0.7 }}
                          >
                            {t(labelKey)}
                          </p>
                          <div className="time-grid">
                            {list.map((s) => (
                              <button
                                key={s.start}
                                type="button"
                                className={`time-option ${slotStart === s.start ? "selected" : ""}`}
                                aria-pressed={slotStart === s.start}
                                onClick={() => setSlotStart(s.start)}
                              >
                                {formatTime(
                                  s.start,
                                  establishment?.timezone,
                                  lang,
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="booking-footer">
                  <Button variant="quiet" onClick={() => setStep(0)}>
                    {t("common.back")}
                  </Button>
                  <Button disabled={!slotStart} onClick={() => setStep(2)}>
                    {t("common.continue")}
                  </Button>
                </div>
              </>
            )}

            {/* Étape 3 — Coordonnées */}
            {step === 2 && (
              <>
                <h2 className="t-h3">{t("book.details")}</h2>
                <p
                  className="t-muted"
                  style={{ fontSize: 10, margin: "4px 0 16px" }}
                >
                  {t("book.detailsHint")}
                </p>
                <div className="form-grid">
                  <Field
                    label={t("book.name")}
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Field
                    label={t("book.phone")}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Field
                    label={t("book.email")}
                    name="email"
                    type="email"
                    autoComplete="email"
                    full
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <label className="consent-row">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>{t("book.consent")}</span>
                </label>
                <div className="booking-footer">
                  <Button variant="quiet" onClick={() => setStep(1)}>
                    {t("common.back")}
                  </Button>
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
                <p
                  className="t-muted"
                  style={{ fontSize: 11, margin: "8px 0" }}
                >
                  {t("book.confirmedHint")}
                </p>
                <div className="booking-ref">
                  {result.booking.publicReference}
                </div>
                <p className="t-muted" style={{ fontSize: 11 }}>
                  {result.booking.service?.name} ·{" "}
                  {formatTime(
                    result.booking.startsAt,
                    establishment?.timezone,
                    lang,
                  )}
                  {result.booking.employee?.displayName
                    ? ` · ${result.booking.employee.displayName}`
                    : ""}
                </p>
                {rescheduleRequested ? (
                  <p className="t-muted" role="status">
                    {t("book.reschedulePending")}
                  </p>
                ) : rescheduleMode ? (
                  <section
                    aria-label={t("book.rescheduleTitle")}
                    style={{ marginTop: 20, textAlign: "start" }}
                  >
                    <h3 className="t-h3">{t("book.rescheduleTitle")}</h3>
                    <Field
                      label={t("book.date")}
                      name="reschedule-date"
                      type="date"
                      value={rescheduleDate}
                      onChange={(event) =>
                        setRescheduleDate(event.target.value)
                      }
                    />
                    {loadingRescheduleSlots ? (
                      <div
                        className="row"
                        style={{ justifyContent: "center", padding: 18 }}
                      >
                        <div
                          className="spin"
                          role="status"
                          aria-label={t("common.loading")}
                        />
                      </div>
                    ) : uniqueRescheduleSlots.length === 0 ? (
                      <p className="t-muted" style={{ fontSize: 10 }}>
                        {t("book.noSlots")}
                      </p>
                    ) : (
                      <div className="time-grid" style={{ marginTop: 12 }}>
                        {uniqueRescheduleSlots.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            className={`time-option ${rescheduleSlotStart === slot.start ? "selected" : ""}`}
                            aria-pressed={rescheduleSlotStart === slot.start}
                            onClick={() => setRescheduleSlotStart(slot.start)}
                          >
                            {formatTime(
                              slot.start,
                              establishment?.timezone,
                              lang,
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="booking-footer">
                      <Button
                        variant="quiet"
                        onClick={() => setRescheduleMode(false)}
                      >
                        {t("common.back")}
                      </Button>
                      <Button
                        disabled={
                          !selectedRescheduleSlot || submittingReschedule
                        }
                        onClick={submitRescheduleRequest}
                      >
                        {submittingReschedule
                          ? t("book.rescheduleSending")
                          : t("book.rescheduleSubmit")}
                      </Button>
                    </div>
                  </section>
                ) : (
                  <Button
                    variant="quiet"
                    style={{ marginTop: 14 }}
                    onClick={() => setRescheduleMode(true)}
                  >
                    {t("book.rescheduleTitle")}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Résumé */}
          {step > 0 && step < 3 && service && (
            <aside className="summary-card">
              <h3 className="t-title" style={{ marginBottom: 12 }}>
                {t("book.summary")}
              </h3>
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
                <strong>
                  {selectedSlot
                    ? formatTime(
                        selectedSlot.start,
                        establishment?.timezone,
                        lang,
                      )
                    : "—"}
                </strong>
              </div>
              <div className="summary-row" style={{ borderBottom: 0 }}>
                <span>{t("book.price")}</span>
                <strong>{formatPrice(service.price, currency, lang)}</strong>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
