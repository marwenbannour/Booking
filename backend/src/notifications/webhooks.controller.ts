import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Inject,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/public.decorator.js';
import { WHATSAPP_PROVIDER } from './notification.constants.js';
import type { WhatsAppProvider } from './whatsapp/whatsapp-provider.interface.js';
import { NotificationsWebhookService } from './notifications-webhook.service.js';

@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsAppWebhooksController {
  constructor(
    private readonly config: ConfigService,
    private readonly webhookService: NotificationsWebhookService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  /**
   * Meta verification handshake: echoes `hub.challenge` when the verify token
   * matches the configured value.
   */
  @Public()
  @Get()
  verify(@Query() query: Record<string, string>): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    const expected = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && expected && token === expected) {
      return challenge ?? '';
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  /**
   * Delivery/status callback. The request signature is verified against the raw
   * body before any payload is trusted.
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
  ): Promise<{ received: boolean; applied: number }> {
    const rawBody = request.rawBody ?? Buffer.alloc(0);
    if (!this.provider.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const applied = await this.webhookService.applyDeliveryWebhook(
      request.body,
    );
    return { received: true, applied };
  }
}
