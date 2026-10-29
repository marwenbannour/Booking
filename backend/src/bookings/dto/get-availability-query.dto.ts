import { IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';

export class GetAvailabilityQueryDto {
  @IsNotEmpty()
  @IsUUID()
  serviceId!: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
