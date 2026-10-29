import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WhatsAppDeliveryStatus } from './whatsapp-provider.interface.js';

/**
 * Verifies a Meta `x-hub-signature-256` header against the raw request body
 * using the app secret. Uses a constant-time comparison.
 */
export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!appSecret || !signatureHeader) {
    return false;
  }

  const [scheme, provided] = signatureHeader.split('=');
  if (scheme !== 'sha256' || !provided) {
    return false;
  }

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const providedBuffer = Buffer.from(provided, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function mapStatus(status: unknown): WhatsAppDeliveryStatus['status'] {
  switch (status) {
    case 'sent':
      return 'SENT';
    case 'delivered':
    case 'read':
      return 'DELIVERED';
    case 'failed':
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Extracts delivery status updates from a Meta WhatsApp Business webhook body.
 * Tolerant of partial payloads: anything that does not match the expected
 * shape is ignored rather than throwing.
 */
export function parseMetaDeliveryStatuses(
  payload: unknown,
): WhatsAppDeliveryStatus[] {
  const results: WhatsAppDeliveryStatus[] = [];
  if (!payload || typeof payload !== 'object') {
    return results;
  }

  const entries = (payload as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) {
    return results;
  }

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown }).changes;
    if (!Array.isArray(changes)) {
      continue;
    }

    for (const change of changes) {
      const value = (change as { value?: unknown }).value;
      const statuses = (value as { statuses?: unknown } | undefined)?.statuses;
      if (!Array.isArray(statuses)) {
        continue;
      }

      for (const status of statuses) {
        const record = status as {
          id?: unknown;
          status?: unknown;
          errors?: Array<{ code?: unknown; title?: unknown; message?: unknown }>;
        };
        if (typeof record.id !== 'string') {
          continue;
        }

        const firstError = Array.isArray(record.errors)
          ? record.errors[0]
          : undefined;

        results.push({
          providerMessageId: record.id,
          status: mapStatus(record.status),
          errorCode:
            typeof firstError?.code === 'number' ||
            typeof firstError?.code === 'string'
              ? String(firstError.code)
              : undefined,
          errorMessage:
            typeof firstError?.title === 'string'
              ? firstError.title
              : typeof firstError?.message === 'string'
                ? firstError.message
                : undefined,
          raw: record,
        });
      }
    }
  }

  return results;
}
