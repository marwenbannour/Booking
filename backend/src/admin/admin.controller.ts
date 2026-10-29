import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import {
  AdminAuditQueryDto,
  AdminEstablishmentsQueryDto,
  AdminSubscriptionsQueryDto,
  SetEstablishmentStatusDto,
} from './dto/admin-query.dto.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide counts (super-admin)' })
  overview() {
    return this.admin.getOverview();
  }

  @Get('establishments')
  @ApiOperation({ summary: 'List all establishments (super-admin)' })
  listEstablishments(@Query() query: AdminEstablishmentsQueryDto) {
    return this.admin.listEstablishments(query);
  }

  @Patch('establishments/:id/status')
  @ApiOperation({ summary: 'Change an establishment status (super-admin)' })
  setStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: SetEstablishmentStatusDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.admin.setEstablishmentStatus(actor.userId, id, body);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all subscriptions (super-admin)' })
  listSubscriptions(@Query() query: AdminSubscriptionsQueryDto) {
    return this.admin.listSubscriptions(query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs (super-admin)' })
  listAuditLogs(@Query() query: AdminAuditQueryDto) {
    return this.admin.listAuditLogs(query);
  }
}
