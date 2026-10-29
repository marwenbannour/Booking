import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/public.decorator.js';
import { PaymentsService } from './payments.service.js';

@ApiExcludeController()
@Controller('webhooks/payments')
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string | undefined,
  ): Promise<{ received: boolean; applied: boolean }> {
    const rawBody = request.rawBody ?? Buffer.alloc(0);
    if (!this.payments.verifySignature(rawBody, signature)) {
      throw new ForbiddenException('Invalid payment webhook signature');
    }
    const { applied } = await this.payments.handleEvent(request.body);
    return { received: true, applied };
  }
}
