import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsQueryDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsEnum([
    'PENDING',
    'PROCESSING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'UNKNOWN',
    'CANCELLED',
  ])
  status?:
    | 'PENDING'
    | 'PROCESSING'
    | 'SENT'
    | 'DELIVERED'
    | 'FAILED'
    | 'UNKNOWN'
    | 'CANCELLED';

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
