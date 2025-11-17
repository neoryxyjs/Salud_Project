import { IsString, IsOptional, IsObject, IsArray, ValidateIf } from 'class-validator';

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
  rut?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  currentInsurer?: string;

  @IsOptional()
  @IsString()
  paymentRegion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasons?: string[];

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsObject()
  utm?: Record<string, any>;
}

