/**
 * Raised when a send fails for a reason that may succeed on retry (network
 * failure, provider 5xx, rate limiting). The worker lets BullMQ retry these.
 */
export class WhatsAppTransientError extends Error {
  constructor(
    message: string,
    readonly code = 'WHATSAPP_TRANSIENT_ERROR',
  ) {
    super(message);
    this.name = 'WhatsAppTransientError';
  }
}

/**
 * Raised when a send fails for a reason that will not change on retry (invalid
 * recipient, template rejected, authentication failure). The worker marks the
 * job as permanently failed and does not retry.
 */
export class WhatsAppPermanentError extends Error {
  constructor(
    message: string,
    readonly code = 'WHATSAPP_PERMANENT_ERROR',
  ) {
    super(message);
    this.name = 'WhatsAppPermanentError';
  }
}
