import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class ListCampaignsDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  client?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  user?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
