import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { CreateEmployeeInvitationDto } from './dto/create-employee-invitation.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { CreateTimeOffDto } from './dto/create-time-off.dto.js';
import {
  CustomerBookingsQueryDto,
  ListCustomersQueryDto,
} from './dto/list-customers-query.dto.js';
import { ListTimeOffsQueryDto } from './dto/list-time-offs-query.dto.js';
import { SetBusinessHoursDto } from './dto/business-hours.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto.js';
import { EstablishmentsManagementService } from './establishments-management.service.js';

@ApiTags('establishments')
@ApiBearerAuth()
@Controller('establishments/:establishmentId')
export class EstablishmentsManagementController {
  constructor(
    private readonly managementService: EstablishmentsManagementService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get an establishment profile in the current tenant',
  })
  getEstablishment(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.getEstablishment(
      actor.userId,
      establishmentId,
    );
  }

  @Patch()
  @ApiOperation({ summary: 'Update establishment settings' })
  updateEstablishment(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: UpdateEstablishmentDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.updateEstablishment(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Get('business-hours')
  @ApiOperation({ summary: 'Get the establishment weekly business hours' })
  getEstablishmentBusinessHours(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.getEstablishmentBusinessHours(
      actor.userId,
      establishmentId,
    );
  }

  @Put('business-hours')
  @ApiOperation({ summary: 'Replace the establishment weekly business hours' })
  replaceEstablishmentBusinessHours(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: SetBusinessHoursDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.replaceEstablishmentBusinessHours(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Get('time-offs')
  @ApiOperation({ summary: 'List employee time off in this establishment' })
  listTimeOffs(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Query() query: ListTimeOffsQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listTimeOffs(
      actor.userId,
      establishmentId,
      query,
    );
  }

  @Post('time-offs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a time-off interval for an employee' })
  createTimeOff(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: CreateTimeOffDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.createTimeOff(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Delete('time-offs/:timeOffId')
  @ApiOperation({ summary: 'Delete an employee time-off interval' })
  deleteTimeOff(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('timeOffId', new ParseUUIDPipe()) timeOffId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.deleteTimeOff(
      actor.userId,
      establishmentId,
      timeOffId,
    );
  }

  @Get('services')
  @ApiOperation({ summary: 'List services belonging to an establishment' })
  listServices(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listServices(actor.userId, establishmentId);
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a service in an establishment' })
  createService(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: CreateServiceDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.createService(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Patch('services/:serviceId')
  @ApiOperation({ summary: 'Update a service in an establishment' })
  updateService(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Body() body: UpdateServiceDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.updateService(
      actor.userId,
      establishmentId,
      serviceId,
      body,
    );
  }

  @Delete('services/:serviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a service without deleting booking history',
  })
  deactivateService(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.deactivateService(
      actor.userId,
      establishmentId,
      serviceId,
    );
  }

  @Get('employees')
  @ApiOperation({ summary: 'List employees belonging to an establishment' })
  listEmployees(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listEmployees(actor.userId, establishmentId);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Search customers in the current establishment' })
  listCustomers(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Query() query: ListCustomersQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listCustomers(
      actor.userId,
      establishmentId,
      query,
    );
  }

  @Get('customers/:customerId/bookings')
  @ApiOperation({ summary: 'List a customer booking history' })
  listCustomerBookings(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Query() query: CustomerBookingsQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listCustomerBookings(
      actor.userId,
      establishmentId,
      customerId,
      query,
    );
  }

  @Get('customers/:customerId')
  @ApiOperation({ summary: 'Get a customer profile in the current tenant' })
  getCustomer(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.getCustomer(
      actor.userId,
      establishmentId,
      customerId,
    );
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an employee profile from an active membership',
  })
  createEmployee(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: CreateEmployeeDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.createEmployee(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Post('employees/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a one-time invitation for an employee' })
  inviteEmployee(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: CreateEmployeeInvitationDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.inviteEmployee(
      actor.userId,
      establishmentId,
      body,
    );
  }

  @Get('employees/invitations')
  @ApiOperation({ summary: 'List pending employee invitations' })
  listEmployeeInvitations(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.listEmployeeInvitations(
      actor.userId,
      establishmentId,
    );
  }

  @Delete('employees/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke a pending employee invitation' })
  revokeEmployeeInvitation(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.revokeEmployeeInvitation(
      actor.userId,
      establishmentId,
      invitationId,
    );
  }

  @Post('ownership/transfer')
  @ApiOperation({ summary: 'Transfer establishment ownership to an active member' })
  transferOwnership(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Body() body: TransferOwnershipDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.transferOwnership(
      actor.userId,
      establishmentId,
      body.targetMembershipId,
    );
  }

  @Patch('employees/:employeeId')
  @ApiOperation({ summary: 'Update an employee and their assigned services' })
  updateEmployee(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() body: UpdateEmployeeDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.updateEmployee(
      actor.userId,
      establishmentId,
      employeeId,
      body,
    );
  }

  @Get('employees/:employeeId/business-hours')
  @ApiOperation({ summary: 'Get an employee weekly schedule override' })
  getEmployeeBusinessHours(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.getEmployeeBusinessHours(
      actor.userId,
      establishmentId,
      employeeId,
    );
  }

  @Put('employees/:employeeId/business-hours')
  @ApiOperation({ summary: 'Replace an employee weekly schedule override' })
  replaceEmployeeBusinessHours(
    @Param('establishmentId', new ParseUUIDPipe()) establishmentId: string,
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() body: SetBusinessHoursDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.managementService.replaceEmployeeBusinessHours(
      actor.userId,
      establishmentId,
      employeeId,
      body,
    );
  }
}
