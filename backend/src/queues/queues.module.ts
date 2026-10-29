import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

export const BOOKING_NOTIFICATIONS_QUEUE = 'booking-notifications';
export const PLATFORM_TASKS_QUEUE = 'platform-tasks';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = Number(config.getOrThrow<string>('REDIS_PORT'));
        if (!Number.isInteger(port) || port < 1 || port > 65_535) {
          throw new Error('REDIS_PORT must be a valid TCP port');
        }

        return {
          connection: {
            host: config.getOrThrow<string>('REDIS_HOST'),
            port,
            password: config.get<string>('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: null,
          },
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1_000 },
            removeOnComplete: { age: 86_400, count: 10_000 },
            removeOnFail: { age: 604_800, count: 10_000 },
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: BOOKING_NOTIFICATIONS_QUEUE },
      { name: PLATFORM_TASKS_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
