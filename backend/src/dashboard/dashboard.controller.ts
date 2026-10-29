import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { DashboardService } from './dashboard.service.js';
import {
  BookingsReportQueryDto,
  DashboardSummaryQueryDto,
  NotificationsReportQueryDto,
} from './dto/dashboard-query.dto.js';

@ApiTags('dashboard')
@Controller()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Key indicators for an establishment' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async summary(
    @Query() query: DashboardSummaryQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.dashboard.getSummary(actor.userId, query.establishmentId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get('reports/bookings')
  @ApiOperation({ summary: 'Bookings report grouped by day/employee/service/status' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'employee', 'service', 'status'],
  })
  async bookingsReport(
    @Query() query: BookingsReportQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.dashboard.getBookingsReport(actor.userId, query.establishmentId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      groupBy: query.groupBy,
    });
  }

  @Get('reports/notifications')
  @ApiOperation({ summary: 'Notifications report grouped by status/eventType/day' })
  @ApiQuery({ name: 'establishmentId', required: true, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['status', 'eventType', 'day'],
  })
  async notificationsReport(
    @Query() query: NotificationsReportQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.dashboard.getNotificationsReport(
      actor.userId,
      query.establishmentId,
      {
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        groupBy: query.groupBy,
      },
    );
  }
}
