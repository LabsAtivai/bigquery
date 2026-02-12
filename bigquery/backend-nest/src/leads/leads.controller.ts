import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { LeadsService } from './leads.service';
import type { Response } from 'express';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Query() query: any) {
    try {
      return await this.leadsService.findAll(query);
    } catch (err) {
      throw new HttpException('Erro ao listar leads', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('filters')
  async filters(@Query() query: any) {
    try {
      return await this.leadsService.getFilters(query);
    } catch (err) {
      throw new HttpException('Erro ao carregar filtros', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export')
  async export(@Query() query: any, @Res() res: Response) {
    try {
      return await this.leadsService.export(query, res);
    } catch (err) {
      throw new HttpException('Erro ao exportar', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}