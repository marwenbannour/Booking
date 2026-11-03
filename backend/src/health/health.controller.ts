import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/public.decorator.js';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Readiness endpoint; verifies PostgreSQL connectivity' })
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error(
        'PostgreSQL readiness check failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException('PostgreSQL is unavailable');
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dependencies: { postgres: 'ok' },
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness endpoint' })
  getLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
