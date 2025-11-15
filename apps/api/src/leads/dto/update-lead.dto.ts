import { IsString, IsOptional } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

