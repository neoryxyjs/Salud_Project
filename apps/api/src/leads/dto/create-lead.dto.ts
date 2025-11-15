import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsObject()
  utm?: Record<string, any>;
}

