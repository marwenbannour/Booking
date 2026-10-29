import { buildBookingMessage } from './message-builder.js';

describe('buildBookingMessage', () => {
  const baseContext = {
    timezone: 'Africa/Tunis',
    establishmentName: 'Salon Atelier 17',
    customerName: 'Alice',
    serviceName: 'Coupe',
    startsAt: new Date('2026-11-10T09:00:00.000Z'),
    publicReference: 'BK-ABC123',
  };

  it('selects the reminder template and carries stable body parameters', () => {
    const message = buildBookingMessage('BOOKING_REMINDER_DUE', {
      ...baseContext,
      locale: 'fr',
    });

    expect(message.templateName).toBe('booking_reminder');
    expect(message.languageCode).toBe('fr');
    expect(message.bodyParameters[0]).toBe('Alice');
    expect(message.bodyParameters[1]).toBe('Salon Atelier 17');
    expect(message.bodyParameters[3]).toBe('Coupe');
    expect(message.previewText).toContain('Alice');
  });

  it('builds an Arabic confirmation when the locale is ar', () => {
    const message = buildBookingMessage('BOOKING_CONFIRMED', {
      ...baseContext,
      locale: 'ar',
    });

    expect(message.templateName).toBe('booking_confirmation');
    expect(message.languageCode).toBe('ar');
    expect(message.previewText).toContain('Salon Atelier 17');
  });

  it('falls back to French for an unknown locale', () => {
    const message = buildBookingMessage('BOOKING_CANCELLED', {
      ...baseContext,
      locale: 'en',
    });

    expect(message.languageCode).toBe('fr');
    expect(message.templateName).toBe('booking_cancellation');
  });
});
