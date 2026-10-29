import type { NotificationEventType } from '../notification.constants.js';

export interface BookingMessageContext {
  locale: string;
  timezone: string;
  establishmentName: string;
  customerName: string;
  serviceName: string;
  startsAt: Date;
  publicReference: string;
  cancellationReason?: string | null;
}

export interface BuiltMessage {
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
  previewText: string;
}

const TEMPLATE_BY_EVENT: Record<NotificationEventType, string> = {
  BOOKING_CREATED: 'booking_received',
  BOOKING_CONFIRMED: 'booking_confirmation',
  BOOKING_UPDATED: 'booking_update',
  BOOKING_CANCELLED: 'booking_cancellation',
  BOOKING_REMINDER_DUE: 'booking_reminder',
  BOOKING_COMPLETED: 'booking_thanks',
};

function formatDateTime(date: Date, timezone: string, locale: string): string {
  const intlLocale = locale === 'ar' ? 'ar-TN' : 'fr-FR';
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function buildPreview(
  eventType: NotificationEventType,
  locale: string,
  context: BookingMessageContext,
  when: string,
): string {
  const isArabic = locale === 'ar';
  const { customerName, establishmentName, serviceName } = context;

  if (isArabic) {
    switch (eventType) {
      case 'BOOKING_REMINDER_DUE':
        return `تذكير: ${customerName}، لديك موعد "${serviceName}" في ${establishmentName} ${when}.`;
      case 'BOOKING_CANCELLED':
        return `${customerName}، تم إلغاء موعدك "${serviceName}" في ${establishmentName} (${when}).`;
      case 'BOOKING_UPDATED':
        return `${customerName}، تم تحديث موعدك "${serviceName}" في ${establishmentName} إلى ${when}.`;
      case 'BOOKING_COMPLETED':
        return `شكراً ${customerName} على زيارة ${establishmentName}.`;
      default:
        return `${customerName}، تم تأكيد موعدك "${serviceName}" في ${establishmentName} ${when}.`;
    }
  }

  switch (eventType) {
    case 'BOOKING_REMINDER_DUE':
      return `Rappel : ${customerName}, vous avez rendez-vous pour "${serviceName}" chez ${establishmentName} ${when}.`;
    case 'BOOKING_CANCELLED':
      return `${customerName}, votre rendez-vous "${serviceName}" chez ${establishmentName} (${when}) a été annulé.`;
    case 'BOOKING_UPDATED':
      return `${customerName}, votre rendez-vous "${serviceName}" chez ${establishmentName} est déplacé au ${when}.`;
    case 'BOOKING_COMPLETED':
      return `Merci ${customerName} d'avoir choisi ${establishmentName}.`;
    default:
      return `${customerName}, votre rendez-vous "${serviceName}" chez ${establishmentName} est confirmé ${when}.`;
  }
}

/**
 * Builds the template name, language, ordered body parameters, and a plain
 * preview for a given booking event. Body parameter ordering is kept stable so
 * approved provider templates can rely on it:
 *   {{1}} customer name, {{2}} establishment, {{3}} date/time, {{4}} service.
 */
export function buildBookingMessage(
  eventType: NotificationEventType,
  context: BookingMessageContext,
): BuiltMessage {
  const locale = context.locale === 'ar' ? 'ar' : 'fr';
  const when = formatDateTime(context.startsAt, context.timezone, locale);

  return {
    templateName: TEMPLATE_BY_EVENT[eventType],
    languageCode: locale,
    bodyParameters: [
      context.customerName,
      context.establishmentName,
      when,
      context.serviceName,
    ],
    previewText: buildPreview(eventType, locale, context, when),
  };
}
