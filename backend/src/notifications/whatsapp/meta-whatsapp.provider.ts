import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  WhatsAppDeliveryStatus,
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
} from './whatsapp-provider.interface.js';
import {
  WhatsAppPermanentError,
  WhatsAppTransientError,
} from './whatsapp.errors.js';
import {
  parseMetaDeliveryStatuses,
  verifyMetaSignature,
} from './meta-webhook.util.js';

/**
 * WhatsApp Business Platform (Meta Cloud API) provider. Sends approved
 * template messages via the Graph API and verifies inbound delivery webhooks.
 */
@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'meta';

  private readonly logger = new Logger(MetaWhatsAppProvider.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly appSecret: string;
  private readonly graphVersion: string;
  private readonly requestTimeoutMs: number;

  constructor(config: ConfigService) {
    this.accessToken = config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.appSecret = config.getOrThrow<string>('WHATSAPP_APP_SECRET');
    this.graphVersion = config.get<string>('WHATSAPP_GRAPH_VERSION') ?? 'v21.0';
    this.requestTimeoutMs = Number(
      config.get<string>('WHATSAPP_REQUEST_TIMEOUT_MS') ?? '10000',
    );
  }

  async sendTemplateMessage(
    message: WhatsAppTemplateMessage,
  ): Promise<WhatsAppSendResult> {
    const url = `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: message.to.replace(/[^\d]/g, ''),
      type: 'template',
      template: {
        name: message.templateName,
        language: { code: message.languageCode },
        components: message.bodyParameters.length
          ? [
              {
                type: 'body',
                parameters: message.bodyParameters.map((text) => ({
                  type: 'text',
                  text,
                })),
              },
            ]
          : [],
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch (error) {
      // Network failure or timeout: safe to retry.
      throw new WhatsAppTransientError(
        `WhatsApp request failed: ${(error as Error).message}`,
        'WHATSAPP_NETWORK_ERROR',
      );
    }

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }

    if (!response.ok) {
      const graphError = (parsed as { error?: { message?: string; code?: unknown } })
        .error;
      const code =
        typeof graphError?.code === 'number' ||
        typeof graphError?.code === 'string'
          ? String(graphError.code)
          : String(response.status);
      const detail = graphError?.message ?? `HTTP ${response.status}`;
      if (response.status >= 500 || response.status === 429) {
        throw new WhatsAppTransientError(detail, code);
      }
      throw new WhatsAppPermanentError(detail, code);
    }

    const providerMessageId = (
      parsed as { messages?: Array<{ id?: unknown }> }
    ).messages?.[0]?.id;
    if (typeof providerMessageId !== 'string') {
      // Accepted but no id: treat as permanent so it surfaces for diagnosis.
      throw new WhatsAppPermanentError(
        'WhatsApp accepted the request without returning a message id',
        'WHATSAPP_NO_MESSAGE_ID',
      );
    }

    return { providerMessageId };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): boolean {
    return verifyMetaSignature(rawBody, signatureHeader, this.appSecret);
  }

  parseDeliveryStatuses(payload: unknown): WhatsAppDeliveryStatus[] {
    return parseMetaDeliveryStatuses(payload);
  }
}
