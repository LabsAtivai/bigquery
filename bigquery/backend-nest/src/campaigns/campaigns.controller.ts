// campaigns.controller.ts
import {
  Controller,
  Delete,
  Get,
  Logger,
  Query,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { ExportCampaignDto } from './dto/export-campaign.dto';
import type { Response } from 'express';

@Controller('campaigns')
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name);

  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async list(@Query() query: ListCampaignsDto) {
    return this.campaignsService.list(query);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Query() query: ExportCampaignDto,
    @Res() res: Response,
  ) {
    try {
      const lower = String(query.format || 'csv').toLowerCase();
      if (lower === 'xlsx')
        return this.campaignsService.exportCampaignXLSX(id, res);
      if (lower === 'csv')
        return this.campaignsService.exportCampaignCSV(id, res);
      throw new HttpException(
        'Formato inválido (use csv ou xlsx)',
        HttpStatus.BAD_REQUEST,
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(
        'Erro ao exportar campanha',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao exportar campanha',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
