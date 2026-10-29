import { IsString, Matches, MaxLength } from 'class-validator';

export class SubscribeDto {
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'planCode must be a lowercase plan code',
  })
  planCode!: string;
}
