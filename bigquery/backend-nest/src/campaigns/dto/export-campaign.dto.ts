import { IsIn, IsOptional } from 'class-validator';

export class ExportCampaignDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}
