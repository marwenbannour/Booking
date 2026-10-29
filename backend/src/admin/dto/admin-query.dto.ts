import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminEstablishmentsQueryDto {
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DISABLED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

  @IsOptional()
  @IsString()
  q?: string;

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

export class SetEstablishmentStatusDto {
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DISABLED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

export class AdminSubscriptionsQueryDto {
  @IsOptional()
  @IsEnum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'])
  status?:
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'SUSPENDED'
    | 'CANCELLED'
    | 'EXPIRED';

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

export class AdminAuditQueryDto {
  @IsOptional()
  @IsUUID()
  establishmentId?: string;

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
