// campaigns.controller.ts
import { Controller, Get, Query, Param, Res, HttpException, HttpStatus } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import type { Response } from 'express'

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async list(@Query() query: any) {
    return this.campaignsService.list(query)
  }

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Query('format') format: string = 'csv',
    @Res() res: Response,
  ) {
    try {
      const lower = String(format || 'csv').toLowerCase()
      if (lower === 'xlsx') return this.campaignsService.exportCampaignXLSX(id, res)
      if (lower === 'csv') return this.campaignsService.exportCampaignCSV(id, res)
      throw new HttpException('Formato inválido (use csv ou xlsx)', HttpStatus.BAD_REQUEST)
    } catch (err: any) {
      if (err instanceof HttpException) throw err
      throw new HttpException('Erro ao exportar campanha', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}