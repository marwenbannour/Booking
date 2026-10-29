import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const MAX_REMINDER_MINUTES = 20_160; // 14 days

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  cancellationEnabled?: boolean;

  // `null` disables the reminder; a positive number sets the lead time.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(MAX_REMINDER_MINUTES)
  firstReminderMinutesBefore?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(MAX_REMINDER_MINUTES)
  secondReminderMinutesBefore?: number | null;
}
