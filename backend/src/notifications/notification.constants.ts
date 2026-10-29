export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export const NOTIFICATION_DISPATCH_JOB = 'dispatch-notification';

export type NotificationEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_UPDATED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER_DUE'
  | 'BOOKING_COMPLETED';

export interface DispatchJobData {
  notificationJobId: string;
  establishmentId: string;
  eventType: NotificationEventType;
}
