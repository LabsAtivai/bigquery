export class ExportCampaignDto {
  campaignName: string;
  user?: string;
  format?: 'csv' | 'xlsx';
}