import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useLocale } from './LocaleContext';
import {
  createBooking,
  fetchAvailability,
  fetchEmployees,
  fetchEstablishment,
  fetchServices,
  requestReschedule,
  type AvailabilitySlot,
  type BookingResult,
  type Employee,
  type PublicEstablishment,
  type PublicService,
} from '../api';

export type BookingStep = 'service' | 'slot' | 'details' | 'confirmation';

interface BookingContextValue {
  establishment: PublicEstablishment | null;
  services: PublicService[];
  currency: string;
  employees: Employee[];
  slots: AvailabilitySlot[];
  bookings: BookingResult[];
  selectedService: PublicService | null;
  selectedEmployeeId: string;
  selectedDate: string;
  selectedStart: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  consent: boolean;
  booking: BookingResult | null;
  step: BookingStep;
  loadingBusiness: boolean;
  loadingBookings: boolean;
  loadingEmployees: boolean;
  loadingSlots: boolean;
  submitting: boolean;
  rescheduleMode: boolean;
  rescheduleDate: string;
  rescheduleSlots: AvailabilitySlot[];
  loadingRescheduleSlots: boolean;
  submittingReschedule: boolean;
  rescheduleRequested: boolean;
  error: string | null;
  isConfigured: boolean;
  timezone?: string;
  setError: (message: string | null) => void;
  chooseService: (service: PublicService) => void;
  beginBooking: (service?: PublicService) => void;
  resetBooking: () => void;
  setStep: (step: BookingStep) => void;
  setEmployee: (id: string) => void;
  setDate: (date: string) => void;
  setStart: (start: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerEmail: (email: string) => void;
  setConsent: (consent: boolean) => void;
  setRescheduleMode: (enabled: boolean) => void;
  setRescheduleDate: (date: string) => void;
  submitRescheduleRequest: (slot: AvailabilitySlot) => Promise<void>;
  submitBooking: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | null>(null);
const RECEIPTS_STORAGE_KEY = 'booking-receipts-v1';
const MAX_SAVED_BOOKINGS = 5;

function isBookingResult(value: unknown): value is BookingResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  const booking = result.booking;
  const establishment = result.establishment;
  if (!booking || typeof booking !== 'object' || !establishment || typeof establishment !== 'object') return false;

  const savedBooking = booking as Record<string, unknown>;
  const savedEstablishment = establishment as Record<string, unknown>;
  const service = savedBooking.service;
  const employee = savedBooking.employee;
  return (
    typeof savedBooking.id === 'string' &&
    typeof savedBooking.publicReference === 'string' &&
    typeof savedBooking.startsAt === 'string' &&
    typeof savedBooking.endsAt === 'string' &&
    typeof savedEstablishment.name === 'string' &&
    (service === undefined ||
      (typeof service === 'object' &&
        service !== null &&
        typeof (service as Record<string, unknown>).name === 'string' &&
        typeof (service as Record<string, unknown>).durationMinutes === 'number')) &&
    (employee === undefined ||
      (typeof employee === 'object' &&
        employee !== null &&
        typeof (employee as Record<string, unknown>).displayName === 'string'))
  );
}

function todayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function idempotencyKey(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BookingProvider({ children }: PropsWithChildren) {
  const establishmentSlug = process.env.EXPO_PUBLIC_ESTABLISHMENT_SLUG?.trim() ?? '';
  const { locale, t } = useLocale();
  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [currency, setCurrency] = useState('TND');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedStart, setSelectedStart] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<BookingStep>('service');
  const [loadingBusiness, setLoadingBusiness] = useState(Boolean(establishmentSlug));
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(todayKey());
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleRequested, setRescheduleRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (Platform.OS === 'web') {
      setBookingsLoaded(true);
      return;
    }

    SecureStore.getItemAsync(RECEIPTS_STORAGE_KEY)
      .then(async (stored) => {
        if (!active || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          setError(t('error.invalidReceipt'));
          await SecureStore.deleteItemAsync(RECEIPTS_STORAGE_KEY);
          return;
        }
        const validBookings = parsed.filter(isBookingResult);
        if (validBookings.length !== parsed.length) {
          setError(t('error.invalidReceipts'));
        }
        const savedBookings = validBookings.slice(0, MAX_SAVED_BOOKINGS);
        setBookings((current) => [
          ...current,
          ...savedBookings.filter((saved) => !current.some((item) => item.booking.id === saved.booking.id)),
        ].slice(0, MAX_SAVED_BOOKINGS));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t('error.readReceipts'));
      })
      .finally(() => {
        if (active) setBookingsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!bookingsLoaded || Platform.OS === 'web') return;
    const saveReceipts = bookings.length
      ? SecureStore.setItemAsync(RECEIPTS_STORAGE_KEY, JSON.stringify(bookings))
      : SecureStore.deleteItemAsync(RECEIPTS_STORAGE_KEY);
    saveReceipts.catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : t('error.saveReceipt'));
    });
  }, [bookings, bookingsLoaded, t]);

  useEffect(() => {
    let active = true;
    if (!establishmentSlug) return;

    Promise.all([fetchEstablishment(establishmentSlug), fetchServices(establishmentSlug)])
      .then(([business, result]) => {
        if (!active) return;
        setEstablishment(business);
        setServices(result.services);
        setCurrency(result.currency || business.currency);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de charger cet établissement.');
      })
      .finally(() => {
        if (active) setLoadingBusiness(false);
      });

    return () => {
      active = false;
    };
  }, [establishmentSlug]);

  useEffect(() => {
    if (!selectedService || step !== 'slot' || !establishmentSlug) return;
    let active = true;
    setLoadingEmployees(true);
    setEmployees([]);
    fetchEmployees(establishmentSlug, selectedService.id)
      .then((list) => {
        if (active) setEmployees(list);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Impossible de charger les professionnels.');
      })
      .finally(() => {
        if (active) setLoadingEmployees(false);
      });
    return () => {
      active = false;
    };
  }, [establishmentSlug, selectedService, step]);

  useEffect(() => {
    if (!selectedService || step !== 'slot' || !establishmentSlug) return;
    let active = true;
    setLoadingSlots(true);
    setSlots([]);
    fetchAvailability(establishmentSlug, selectedService.id, selectedDate, selectedEmployeeId || undefined)
      .then((result) => {
        if (active) setSlots(result.slots);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Les créneaux sont indisponibles.');
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [establishmentSlug, selectedDate, selectedEmployeeId, selectedService, step]);

  useEffect(() => {
    if (
      !rescheduleMode ||
      step !== 'confirmation' ||
      !selectedService ||
      !establishmentSlug
    ) {
      return;
    }

    let active = true;
    setLoadingRescheduleSlots(true);
    setRescheduleSlots([]);
    fetchAvailability(
      establishmentSlug,
      selectedService.id,
      rescheduleDate,
      selectedEmployeeId || undefined,
    )
      .then((result) => {
        if (active) setRescheduleSlots(result.slots);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t('error.availability'));
      })
      .finally(() => {
        if (active) setLoadingRescheduleSlots(false);
      });

    return () => {
      active = false;
    };
  }, [establishmentSlug, rescheduleDate, rescheduleMode, selectedEmployeeId, selectedService, step, t]);

  const uniqueSlots = useMemo(() => {
    const seen = new Set<string>();
    return slots
      .filter((slot) => {
        if (seen.has(slot.start)) return false;
        seen.add(slot.start);
        return true;
      })
      .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  }, [slots]);

  function beginBooking(service?: PublicService) {
    setError(null);
    setRescheduleMode(false);
    setRescheduleRequested(false);
    setRescheduleDate(todayKey());
    setSelectedService(service ?? null);
    setSelectedEmployeeId('');
    setSelectedStart('');
    setSelectedDate(todayKey());
    setStep(service ? 'slot' : 'service');
  }

  function resetBooking() {
    beginBooking();
  }

  function chooseService(service: PublicService) {
    setError(null);
    setSelectedService(service);
    setSelectedEmployeeId('');
    setSelectedStart('');
    setSelectedDate(todayKey());
    setStep('slot');
  }

  async function submitBooking() {
    if (!establishmentSlug || !selectedService || !selectedStart) return;
    setError(null);
    if (customerName.trim().length < 2) {
      setError(t('error.name'));
      return;
    }
    if (customerPhone.trim().length < 6) {
      setError(t('error.phone'));
      return;
    }

    const selectedSlot = uniqueSlots.find((slot) => slot.start === selectedStart);
    if (!selectedSlot) {
      setError(t('error.slot'));
      setStep('slot');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking(establishmentSlug, {
        serviceId: selectedService.id,
        employeeId: selectedSlot.employeeId,
        startsAt: selectedSlot.start,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        consentToReminders: consent,
        locale,
      }, idempotencyKey());
      setBookings((current) => [
        result,
        ...current.filter((saved) => saved.booking.id !== result.booking.id),
      ].slice(0, MAX_SAVED_BOOKINGS));
      setStep('confirmation');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t('error.booking'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRescheduleRequest(slot: AvailabilitySlot) {
    const booking = bookings[0];
    if (!booking?.customerAccessToken) {
      setError(t('error.rescheduleToken'));
      return;
    }

    setError(null);
    setSubmittingReschedule(true);
    try {
      await requestReschedule(
        booking.booking.id,
        booking.customerAccessToken,
        slot.start,
        slot.employeeId,
      );
      setRescheduleRequested(true);
      setRescheduleMode(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t('error.reschedule'));
    } finally {
      setSubmittingReschedule(false);
    }
  }

  const value: BookingContextValue = {
    establishment,
    services,
    currency,
    employees,
    slots: uniqueSlots,
    bookings,
    booking: bookings[0] ?? null,
    selectedService,
    selectedEmployeeId,
    selectedDate,
    selectedStart,
    customerName,
    customerPhone,
    customerEmail,
    consent,
    step,
    loadingBusiness,
    loadingBookings: !bookingsLoaded,
    loadingEmployees,
    loadingSlots,
    submitting,
    rescheduleMode,
    rescheduleDate,
    rescheduleSlots,
    loadingRescheduleSlots,
    submittingReschedule,
    rescheduleRequested,
    error,
    isConfigured: Boolean(establishmentSlug),
    timezone: establishment?.timezone,
    setError,
    chooseService,
    beginBooking,
    resetBooking,
    setStep,
    setEmployee: (id) => {
      setSelectedEmployeeId(id);
      setSelectedStart('');
    },
    setDate: (date) => {
      setSelectedDate(date);
      setSelectedStart('');
    },
    setStart: setSelectedStart,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setConsent,
    setRescheduleMode: (enabled) => {
      setError(null);
      setRescheduleMode(enabled);
      setRescheduleDate(todayKey());
    },
    setRescheduleDate: (date) => {
      setRescheduleDate(date);
    },
    submitRescheduleRequest,
    submitBooking,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider.');
  return context;
}
