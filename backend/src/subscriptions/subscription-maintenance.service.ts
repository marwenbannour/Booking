import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Periodically advances subscription statuses over time:
 *  - any TRIALING/ACTIVE/PAST_DUE whose current period has ended -> EXPIRED
 *  - a TRIALING whose trial has ended (still within the period) -> PAST_DUE
 *
 * Implemented as a lightweight interval poller (same shape as the outbox
 * relay) to avoid adding a scheduler dependency. Config-gated and safe to run
 * on multiple instances (the UPDATEs are idempotent and narrowly scoped).
 */
@Injectable()
export class SubscriptionMaintenanceService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SubscriptionMaintenanceService.name);
  private readonly enabled: boolean;
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.enabled =
      (this.config.get<string>('SUBSCRIPTION_MAINTENANCE_ENABLED') ??
        'true') !== 'false';
    this.intervalMs = Number(
      this.config.get<string>('SUBSCRIPTION_MAINTENANCE_INTERVAL_MS') ??
        '60000',
    );
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('Subscription maintenance disabled by configuration');
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const result = await this.runOnce();
      if (result.expired || result.pastDue) {
        this.logger.log(
          `Subscription maintenance: ${result.expired} expired, ${result.pastDue} past due`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Subscription maintenance failed: ${(error as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }

  /** Applies the time-based transitions once. Returns affected counts. */
  async runOnce(now = new Date()): Promise<{ expired: number; pastDue: number }> {
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
        currentPeriodEnd: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });

    const pastDue = await this.prisma.subscription.updateMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { lte: now },
        currentPeriodEnd: { gt: now },
      },
      data: { status: 'PAST_DUE' },
    });

    return { expired: expired.count, pastDue: pastDue.count };
  }
}
