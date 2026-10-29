/**
 * Provider-agnostic contract for sending template messages over WhatsApp and
 * for interpreting delivery webhooks. Concrete implementations (mock, Meta
 * Cloud API, or any authorised BSP) are isolated behind this interface so the
 * booking and notification business rules never depend on a specific vendor.
 */
export interface WhatsAppTemplateMessage {
  /** Recipient phone number in E.164 form (digits, optional leading +). */
  to: string;
  /** Approved template name registered with the provider. */
  templateName: string;
  /** Template language code, e.g. `fr`, `ar`. */
  languageCode: string;
  /** Ordered body parameters substituted into the template placeholders. */
  bodyParameters: string[];
  /** Plain-text preview, used for logging and by the mock provider. */
  previewText: string;
}

export interface WhatsAppSendResult {
  /** Provider-assigned message id, correlated later with delivery webhooks. */
  providerMessageId: string;
}

/**
 * A single delivery status update extracted from a provider webhook payload.
 */
export interface WhatsAppDeliveryStatus {
  providerMessageId: string;
  /** Normalised status mapped onto our NotificationStatus vocabulary. */
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'UNKNOWN';
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

export interface WhatsAppProvider {
  /** Stable identifier recorded on every NotificationLog row. */
  readonly name: string;

  /**
   * Sends a template message. Must throw {@link WhatsAppTransientError} for
   * retryable failures and {@link WhatsAppPermanentError} for terminal ones.
   * A resolved result means the provider accepted the message for delivery —
   * it does not by itself mean the message was delivered.
   */
  sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppSendResult>;

  /**
   * Verifies the authenticity of an inbound webhook request. Implementations
   * that cannot verify (e.g. the mock) return the result of a configured flag.
   */
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean;

  /** Extracts delivery status updates from a verified webhook payload. */
  parseDeliveryStatuses(payload: unknown): WhatsAppDeliveryStatus[];
}
