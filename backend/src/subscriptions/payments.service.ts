import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';

interface PaymentEvent {
  event: string;
  provider?: string;
  reference?: string;
  establishmentId?: string;
  amount?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
}

/**
 * Records payments from an authenticated provider webhook and reconciles the
 * subscription state. A subscription is only activated once a payment is
 * confirmed here — never on an unverified request.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    const secret = this.config.get<string>('PAYMENTS_WEBHOOK_SECRET');
    if (!secret || !signatureHeader) {
      return false;
    }
    const provided = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice('sha256='.length)
      : signatureHeader;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  async handleEvent(payload: unknown): Promise<{ applied: boolean }> {
    const event = payload as PaymentEvent;
    if (
      !event ||
      typeof event.event !== 'string' ||
      typeof event.establishmentId !== 'string'
    ) {
      throw new BadRequestException('Malformed payment event');
    }

    const establishment = await this.prisma.establishment.findUnique({
      where: { id: event.establishmentId },
      select: { id: true, currency: true },
    });
    if (!establishment) {
      // Unknown establishment: acknowledge without applying to avoid retries.
      this.logger.warn(
        `Payment event for unknown establishment ${event.establishmentId}`,
      );
      return { applied: false };
    }

    const provider = event.provider ?? 'manual';
    const reference = event.reference ?? null;
    const succeeded = event.event === 'payment.succeeded';
    const periodEnd = event.periodEnd ? new Date(event.periodEnd) : null;

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { establishmentId: establishment.id },
        select: { id: true, currentPeriodEnd: true },
      });

      const paymentData = {
        establishmentId: establishment.id,
        subscriptionId: subscription?.id ?? null,
        amount: event.amount ?? 0,
        currency: event.currency ?? establishment.currency,
        status: (succeeded ? 'SUCCEEDED' : 'FAILED') as 'SUCCEEDED' | 'FAILED',
        paidAt: succeeded ? new Date() : null,
        periodStart: event.periodStart ? new Date(event.periodStart) : null,
        periodEnd,
      };

      if (reference) {
        // Idempotent on (provider, reference): a replayed success is a no-op.
        const existing = await tx.payment.findFirst({
          where: { provider, providerReference: reference },
          select: { id: true, status: true },
        });
        if (existing?.status === 'SUCCEEDED') {
          return { applied: false };
        }
        await tx.payment.upsert({
          where: {
            provider_providerReference: { provider, providerReference: reference },
          },
          create: { provider, providerReference: reference, ...paymentData },
          update: {
            subscriptionId: paymentData.subscriptionId,
            status: paymentData.status,
            paidAt: paymentData.paidAt,
            amount: paymentData.amount,
            periodEnd,
          },
        });
      } else {
        await tx.payment.create({
          data: { provider, providerReference: null, ...paymentData },
        });
      }

      if (subscription) {
        if (succeeded) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: periodEnd ?? subscription.currentPeriodEnd,
            },
          });
        } else {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          establishmentId: establishment.id,
          action: succeeded ? 'payment.succeeded' : 'payment.failed',
          targetType: 'PAYMENT',
          metadata: { provider, reference },
        },
      });

      return { applied: true };
    });
  }
}
