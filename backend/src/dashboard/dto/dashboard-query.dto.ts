import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class DashboardSummaryQueryDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class BookingsReportQueryDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(['day', 'employee', 'service', 'status'])
  groupBy?: 'day' | 'employee' | 'service' | 'status';
}

export class NotificationsReportQueryDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(['status', 'eventType', 'day'])
  groupBy?: 'status' | 'eventType' | 'day';
}
