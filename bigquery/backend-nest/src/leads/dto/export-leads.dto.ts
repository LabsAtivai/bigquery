import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ListLeadsDto } from './list-leads.dto';

export class ExportLeadsDto extends ListLeadsDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';

  @IsOptional()
  @IsString()
  @MaxLength(150)
  campaignName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  downloadedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  setorInformado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  user?: string;
}
