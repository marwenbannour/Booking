import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  WhatsAppDeliveryStatus,
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
} from './whatsapp-provider.interface.js';
import {
  parseMetaDeliveryStatuses,
  verifyMetaSignature,
} from './meta-webhook.util.js';

/**
 * Development/testing provider. It does not contact WhatsApp: it logs the
 * message it would have sent and returns a synthetic provider message id so
 * the full pipeline (outbox relay, worker, logging) can be exercised locally.
 */
@Injectable()
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock';

  private readonly logger = new Logger(MockWhatsAppProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendTemplateMessage(
    message: WhatsAppTemplateMessage,
  ): Promise<WhatsAppSendResult> {
    const providerMessageId = `mock-${randomUUID()}`;
    this.logger.log(
      `[mock] to=${message.to} template=${message.templateName}/${message.languageCode} id=${providerMessageId} :: ${message.previewText}`,
    );
    return { providerMessageId };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): boolean {
    // When an app secret is configured the mock still verifies real
    // signatures, so Meta-shaped test payloads can be validated locally.
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (appSecret) {
      return verifyMetaSignature(rawBody, signatureHeader, appSecret);
    }
    // Otherwise accept only outside production to avoid a silent no-auth path.
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  parseDeliveryStatuses(payload: unknown): WhatsAppDeliveryStatus[] {
    return parseMetaDeliveryStatuses(payload);
  }
}
