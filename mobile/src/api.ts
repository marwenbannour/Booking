import { Platform } from 'react-native';

const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || `http://${localHost}:3000/api/v1`
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
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

export interface Employee {
  id: string;
  displayName: string;
}

export interface AvailabilitySlot {
  employeeId: string;
  start: string;
  end: string;
}

export interface BookingResult {
  booking: {
    id: string;
    publicReference: string;
    startsAt: string;
    endsAt: string;
    service?: { name: string; durationMinutes: number };
    employee?: { displayName: string };
  };
  establishment: { name: string };
  customerAccessToken?: string;
}

export interface RescheduleRequestResult {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  originalStartsAt: string;
  requestedStartsAt: string;
  createdAt: string;
}

interface ApiErrorBody {
  message?: string | string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(`Le serveur Booking est injoignable. Vérifiez l’URL API (${API_BASE_URL}).`);
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export function fetchEstablishment(slug: string): Promise<PublicEstablishment> {
  return request(`/public/establishments/${encodeURIComponent(slug)}`);
}

export function fetchServices(slug: string): Promise<{ currency: string; services: PublicService[] }> {
  return request(`/public/establishments/${encodeURIComponent(slug)}/services`);
}

export function fetchEmployees(slug: string, serviceId: string): Promise<Employee[]> {
  const query = new URLSearchParams({ serviceId });
  return request(`/public/establishments/${encodeURIComponent(slug)}/employees?${query}`);
}

export function fetchAvailability(
  slug: string,
  serviceId: string,
  date: string,
  employeeId?: string,
): Promise<{ slots: AvailabilitySlot[] }> {
  const query = new URLSearchParams({ serviceId, date });
  if (employeeId) query.set('employeeId', employeeId);
  return request(`/public/establishments/${encodeURIComponent(slug)}/availability?${query}`);
}

export function createBooking(
  slug: string,
  payload: {
    serviceId: string;
    employeeId?: string;
    startsAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    consentToReminders: boolean;
    locale?: 'fr' | 'ar';
  },
  idempotencyKey: string,
): Promise<BookingResult> {
  return request(`/public/establishments/${encodeURIComponent(slug)}/bookings`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export function requestReschedule(
  bookingId: string,
  customerAccessToken: string,
  requestedStartsAt: string,
  requestedEmployeeId: string,
): Promise<RescheduleRequestResult> {
  return request(`/bookings/public/${bookingId}/reschedule-requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerAccessToken}` },
    body: JSON.stringify({ requestedStartsAt, requestedEmployeeId }),
  });
}
