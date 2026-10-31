// Client HTTP de l'API Booking (NestJS). Porte le contrat de booking-api.js
// du prototype vers TypeScript. Les appels authentifiés rafraîchissent le
// token d'accès automatiquement sur 401.

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

const TOKENS_KEY = "booking.tokens";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/* ---------- Stockage des tokens (par navigateur) ---------- */
export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens | null): void {
  try {
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKENS_KEY);
  } catch {
    /* indisponible (mode privé) : on ignore */
  }
}

/* ---------- Requête de base ---------- */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("Le serveur Booking est injoignable.", undefined, "NETWORK_ERROR");
  }

  const body = (await response.json().catch(() => null)) as
    | { message?: string | string[]; code?: string }
    | null;

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body!.message.join(", ")
      : body?.message || "Une erreur est survenue. Veuillez réessayer.";
    throw new ApiError(message, response.status, body?.code);
  }
  return body as T;
}

/* ---------- Requête authentifiée (refresh sur 401) ---------- */
async function authed<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = loadTokens();
  if (!tokens) throw new ApiError("Session expirée.", 401, "NO_SESSION");

  const withBearer = (token: string): RequestInit => ({
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });

  try {
    return await request<T>(path, withBearer(tokens.accessToken));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    // Tentative de rafraîchissement.
    const refreshed = await request<Tokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    saveTokens(refreshed);
    return request<T>(path, withBearer(refreshed.accessToken));
  }
}

/* ---------- Types de domaine (partiels) ---------- */
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "REJECTED";

export interface BookingListItem {
  id: string;
  publicReference: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string | null;
  employee?: { id: string; displayName: string } | null;
  service?: { id: string; name: string } | null;
}

export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

export interface Me {
  id: string;
  email: string | null;
  phoneNormalized: string | null;
  preferredLocale: string;
  memberships: Array<{
    role: string;
    establishment: { id: string; slug: string; name: string; status: string };
  }>;
}

export interface AvailabilitySlot {
  employeeId: string;
  start: string;
  end: string;
}

/* ---------- API ---------- */
export const api = {
  /* Auth */
  login(identifier: string, password: string) {
    return request<Tokens & { userId?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },
  me() {
    return authed<Me>("/auth/me");
  },
  logout() {
    return authed<void>("/auth/logout", { method: "POST" });
  },

  /* Admin */
  dashboardSummary(establishmentId: string, range: { from?: string; to?: string } = {}) {
    const q = new URLSearchParams({ establishmentId });
    if (range.from) q.set("from", range.from);
    if (range.to) q.set("to", range.to);
    return authed<DashboardSummary>(`/dashboard/summary?${q}`);
  },
  bookings(
    establishmentId: string,
    opts: { limit?: number; offset?: number; from?: string; to?: string; status?: BookingStatus } = {},
  ) {
    const q = new URLSearchParams({ establishmentId });
    q.set("limit", String(opts.limit ?? 100));
    q.set("offset", String(opts.offset ?? 0));
    if (opts.from) q.set("from", opts.from);
    if (opts.to) q.set("to", opts.to);
    if (opts.status) q.set("status", opts.status);
    return authed<Paginated<BookingListItem>>(`/bookings?${q}`);
  },
  transitionBooking(
    establishmentId: string,
    bookingId: string,
    status: BookingStatus,
    reason?: string,
  ) {
    const q = new URLSearchParams({ establishmentId });
    return authed(`/bookings/${bookingId}/status?${q}`, {
      method: "PATCH",
      body: JSON.stringify(reason ? { status, reason } : { status }),
    });
  },

  /* Services */
  listServices(establishmentId: string) {
    return authed<ManagedService[]>(`/establishments/${establishmentId}/services`);
  },
  createService(
    establishmentId: string,
    body: { name: string; durationMinutes: number; description?: string; price?: number },
  ) {
    return authed<ManagedService>(`/establishments/${establishmentId}/services`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  deactivateService(establishmentId: string, serviceId: string) {
    return authed(`/establishments/${establishmentId}/services/${serviceId}`, { method: "DELETE" });
  },

  /* Employés */
  listEmployees(establishmentId: string) {
    return authed<ManagedEmployee[]>(`/establishments/${establishmentId}/employees`);
  },

  /* Clients */
  listCustomers(establishmentId: string, opts: { q?: string; cursor?: string; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (opts.q) q.set("q", opts.q);
    if (opts.cursor) q.set("cursor", opts.cursor);
    if (opts.limit) q.set("limit", String(opts.limit));
    const qs = q.toString();
    return authed<CustomersPage>(
      `/establishments/${establishmentId}/customers${qs ? `?${qs}` : ""}`,
    );
  },

  /* Abonnements */
  subscriptionPlans() {
    return authed<{ items: SubscriptionPlan[] }>("/subscription-plans");
  },
  currentSubscription(establishmentId: string) {
    const q = new URLSearchParams({ establishmentId });
    return authed<CurrentSubscription>(`/subscriptions/current?${q}`);
  },
  subscribe(establishmentId: string, planCode: string) {
    const q = new URLSearchParams({ establishmentId });
    return authed(`/subscriptions?${q}`, { method: "POST", body: JSON.stringify({ planCode }) });
  },
  changePlan(establishmentId: string, planCode: string) {
    const q = new URLSearchParams({ establishmentId });
    return authed(`/subscriptions/change-plan?${q}`, { method: "POST", body: JSON.stringify({ planCode }) });
  },

  /* Notifications */
  listNotifications(establishmentId: string, opts: { status?: string; limit?: number; offset?: number } = {}) {
    const q = new URLSearchParams({ establishmentId });
    if (opts.status) q.set("status", opts.status);
    q.set("limit", String(opts.limit ?? 50));
    q.set("offset", String(opts.offset ?? 0));
    return authed<Paginated<NotificationJobRow>>(`/notifications?${q}`);
  },
  notificationSettings(establishmentId: string) {
    const q = new URLSearchParams({ establishmentId });
    return authed<NotificationSettings>(`/notification-settings?${q}`);
  },
  updateNotificationSettings(establishmentId: string, body: Partial<NotificationSettings>) {
    const q = new URLSearchParams({ establishmentId });
    return authed<NotificationSettings>(`/notification-settings?${q}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /* Établissement */
  establishmentProfile(establishmentId: string) {
    return authed<EstablishmentProfile>(`/establishments/${establishmentId}`);
  },
  updateEstablishment(establishmentId: string, body: Partial<EstablishmentProfile>) {
    return authed<EstablishmentProfile>(`/establishments/${establishmentId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /* Public */
  establishment(slug: string) {
    return request<PublicEstablishment>(`/public/establishments/${encodeURIComponent(slug)}`);
  },
  services(slug: string) {
    return request<{ currency: string; services: PublicService[] }>(
      `/public/establishments/${encodeURIComponent(slug)}/services`,
    );
  },
  employees(slug: string, serviceId: string) {
    const q = new URLSearchParams({ serviceId });
    return request<Array<{ id: string; displayName: string }>>(
      `/public/establishments/${encodeURIComponent(slug)}/employees?${q}`,
    );
  },
  availability(slug: string, serviceId: string, date: string, employeeId?: string) {
    const q = new URLSearchParams({ serviceId, date });
    if (employeeId) q.set("employeeId", employeeId);
    return request<{ date: string; timezone: string; serviceId: string; durationMinutes: number; slots: AvailabilitySlot[] }>(
      `/public/establishments/${encodeURIComponent(slug)}/availability?${q}`,
    );
  },
  createBooking(slug: string, payload: CreateBookingPayload, idempotencyKey: string) {
    return request<CreateBookingResult>(`/public/establishments/${encodeURIComponent(slug)}/bookings`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
  },
};

export interface DashboardSummary {
  [key: string]: unknown;
}
export interface PublicEstablishment {
  slug: string;
  name: string;
  description?: string | null;
  address?: string | null;
  timezone: string;
  currency: string;
  locale: string;
}
export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: string | null;
}
export interface CreateBookingPayload {
  serviceId: string;
  employeeId?: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  consentToReminders: boolean;
}
export interface CreateBookingResult {
  booking: {
    id: string;
    publicReference: string;
    startsAt: string;
    endsAt: string;
    service?: { name: string; durationMinutes: number };
    employee?: { displayName: string };
  };
  establishment: { name: string };
}

export interface ManagedService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedEmployee {
  id: string;
  memberId: string;
  displayName: string;
  isActive: boolean;
  services: Array<{ serviceId: string }>;
  createdAt: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  phoneNormalized?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersPage {
  items: CustomerRow[];
  nextCursor: string | null;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priceAmount: string;
  currency: string;
  interval: "MONTH" | "YEAR";
  trialDays: number;
  maxEmployees?: number | null;
  maxBookingsPerMonth?: number | null;
  maxNotificationsPerMonth?: number | null;
  maxEstablishments?: number | null;
}

export interface UsageMetric {
  used: number;
  limit: number | null;
}

export interface NotificationJobRow {
  id: string;
  bookingId: string;
  channel: string;
  eventType: string;
  status: string;
  scheduledAt: string;
  attempts: number;
  providerMessageId?: string | null;
  errorCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  establishmentId: string;
  whatsappEnabled: boolean;
  confirmationEnabled: boolean;
  cancellationEnabled: boolean;
  firstReminderMinutesBefore: number | null;
  secondReminderMinutesBefore: number | null;
}

export interface EstablishmentProfile {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  address?: string | null;
  timezone: string;
  currency: string;
  locale: string;
  minimumBookingNoticeMinutes: number;
  maximumBookingDays: number;
  cancellationNoticeHours: number;
  status?: string;
}

export interface CurrentSubscription {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: { code: string; name: string; isImplicitFree?: boolean } | null;
  usage: {
    periodStart: string;
    periodEnd: string;
    employees: UsageMetric;
    bookings: UsageMetric;
    notifications: UsageMetric;
  };
}
