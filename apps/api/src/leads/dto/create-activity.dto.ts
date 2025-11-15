import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  type: string; // 'call', 'email', 'note', 'status_change', 'update'

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

