import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { ListLeadsDto } from './dto/list-leads.dto';
import { ExportLeadsDto } from './dto/export-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import type { Response } from 'express';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Query() query: ListLeadsDto) {
    try {
      // ✅ normalize no service (centraliza regra)
      return await this.leadsService.findAll(query);
    } catch (err) {
      this.logger.error(
        'Erro ao listar leads',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao listar leads',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filters')
  async filters(@Query() query: ListLeadsDto) {
    try {
      return await this.leadsService.getFilters(query);
    } catch (err) {
      this.logger.error(
        'Erro ao carregar filtros',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao carregar filtros',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filters/:field')
  async searchFilterField(
    @Param('field') field: string,
    @Query('q') q: string,
    @Query() query: ListLeadsDto,
  ) {
    try {
      return await this.leadsService.searchFieldValues(field, q, query);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(
        'Erro ao buscar valores do filtro',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao buscar valores do filtro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  async export(@Query() query: ExportLeadsDto, @Res() res: Response) {
    try {
      return await this.leadsService.export(query, res);
    } catch (err) {
      this.logger.error(
        'Erro ao exportar leads',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao exportar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateLeadDto) {
    return this.leadsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
