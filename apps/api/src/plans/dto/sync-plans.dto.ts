import { IsArray, IsString, IsInt, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceTierDto {
  @IsInt()
  ageFrom: number;

  @IsInt()
  ageTo: number;

  @IsInt()
  cargas: number;

  @IsString()
  region: string;

  @IsInt()
  priceCLP: number;
}

export class SyncPlanDto {
  @IsString()
  insurerSlug: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsArray()
  @IsString({ each: true })
  regionCodes: string[];

  @IsInt()
  basePriceCLP: number;

  @IsOptional()
  @IsInt()
  coverageHosp?: number;

  @IsOptional()
  @IsInt()
  coverageAmb?: number;

  @IsOptional()
  @IsInt()
  coverageEr?: number;

  @IsOptional()
  @IsNumber()
  annualCapUF?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  networkTags?: string[];

  @IsOptional()
  features?: any;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  tiers?: PriceTierDto[];
}

export class SyncPlansDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncPlanDto)
  plans: SyncPlanDto[];
}

