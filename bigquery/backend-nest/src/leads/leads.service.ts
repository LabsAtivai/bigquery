import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import type { Response } from 'express';
import * as csv from 'fast-csv';
import * as exceljs from 'exceljs';

@Injectable()
export class LeadsService {
  constructor(
    private mongoService: MongoService,
    private campaignsService: CampaignsService,
  ) {}

  private buildMongoFilter(query: any) {
    const filter: any = {};

    const addFilter = (field: string, value: any) => {
      if (!value) return;

      if (Array.isArray(value)) {
        filter[field] = { $in: value };
      } else {
        const v = String(value).trim();
        if (!v) return;
        filter[field] = { $regex: v, $options: 'i' };
      }
    };

    addFilter('setor_empresa', query.setor_empresa);
    addFilter('estado_empresa', query.estado_empresa);
    addFilter('cidade_empresa', query.cidade_empresa);
    addFilter('pais_empresa', query.pais_empresa);
    addFilter('tamanho', query.tamanho);
    addFilter('cargo', query.cargo);
    addFilter('client', query.client);

    return filter;
  }

  private sanitizeCampaignFilters(query: any) {
    return this.buildMongoFilter(query);
  }

  async getFilters(query: any) {
    const db = this.mongoService.getDb();
    const baseFilter = this.buildMongoFilter(query);

    const aggregateField = async (field: string) => {
      return db
        .collection('leads')
        .aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: `$${field}`,
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 100 },
        ])
        .toArray();
    };

    const [
      setores,
      estados,
      cidades,
      paises,
      tamanhos,
      cargos,
      clientes,
    ] = await Promise.all([
      aggregateField('setor_empresa'),
      aggregateField('estado_empresa'),
      aggregateField('cidade_empresa'),
      aggregateField('pais_empresa'),
      aggregateField('tamanho'),
      aggregateField('cargo'),
      aggregateField('client'),
    ]);

    return {
      setores: setores.filter((x) => x._id),
      estados: estados.filter((x) => x._id),
      cidades: cidades.filter((x) => x._id),
      paises: paises.filter((x) => x._id),
      tamanhos: tamanhos.filter((x) => x._id),
      cargos: cargos.filter((x) => x._id),
      clientes: clientes.filter((x) => x._id),
    };
  }

  async findAll(query: any) {
    const db = this.mongoService.getDb();

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = this.buildMongoFilter(query);

    const total = await db.collection('leads').countDocuments(filter);

    const data = await db
      .collection('leads')
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async export(query: any, res: Response) {
    const format = String(query.format || 'xlsx').toLowerCase();

    if (format === 'csv') {
      return this.exportCSV(query, res);
    } else if (format === 'xlsx') {
      return this.exportXLSX(query, res);
    }
    throw new HttpException('Formato inválido', HttpStatus.BAD_REQUEST);
  }

  async exportXLSX(query: any, res: Response) {
    const db = this.mongoService.getDb();
    const filter = this.buildMongoFilter(query);
    const count = await db.collection('leads').countDocuments(filter);

    if (count === 0) {
      throw new HttpException('Nenhum lead encontrado', HttpStatus.NOT_FOUND);
    }

    if (count > 100000) {
      res.setHeader('Warning', 'Export grande - pode demorar');
    }

    const filename = (query.campaignName || 'leads-export') + '-' + Date.now() + '.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const workbook = new exceljs.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet('Leads');

    const cursor = db.collection('leads').find(filter).limit(Number(query.limit) || 0);
    let headersAdded = false;

    for await (const doc of cursor) {
      if (!headersAdded) {
        worksheet.addRow(Object.keys(doc)).commit();
        headersAdded = true;
      }
      worksheet.addRow(Object.values(doc)).commit();
    }

    await workbook.commit();

    await this.campaignsService.createCampaign({
      name: query.campaignName || 'Export ' + new Date().toISOString(),
      client: query.client || null,
      created_by: query.user || 'sistema',
      filters: this.sanitizeCampaignFilters(query),
      leads_count: count,
      file: {
        type: 'xlsx',
        filename,
        path: 'streamed',
      },
      meta: {
        downloaded_by: query.downloadedBy || null,
        setor_informado: query.setorInformado || null,
      },
    });
  }

  async exportCSV(query: any, res: Response) {
    const db = this.mongoService.getDb();
    const filter = this.buildMongoFilter(query);
    const count = await db.collection('leads').countDocuments(filter);

    if (count === 0) {
      throw new HttpException('Nenhum lead encontrado', HttpStatus.NOT_FOUND);
    }

    if (count > 100000) {
      res.setHeader('Warning', 'Export grande - pode demorar');
    }

    const filename = (query.campaignName || 'leads-export') + '-' + Date.now() + '.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const cursor = db.collection('leads').find(filter).limit(Number(query.limit) || 0);
    const fixedFields = [
      'email', 'nome', 'cargo', 'empresa', 'setor_empresa', 'tamanho', 'cidade_empresa',
      'estado_empresa', 'pais_empresa', 'phone', 'updated_at', 'import_id',
    ];

    const csvStream = csv.format({ headers: fixedFields, delimiter: ';' });
    csvStream.pipe(res);

    for await (const doc of cursor) {
      const row: any = {};
      fixedFields.forEach(field => {
        row[field] = doc[field] ?? '';
      });
      csvStream.write(row);
    }

    csvStream.end();

    await this.campaignsService.createCampaign({
      name: query.campaignName || 'Export ' + new Date().toISOString(),
      client: query.client || null,
      created_by: query.user || 'sistema',
      filters: this.sanitizeCampaignFilters(query),
      leads_count: count,
      file: {
        type: 'csv',
        filename,
        path: 'streamed',
      },
      meta: {
        downloaded_by: query.downloadedBy || null,
        setor_informado: query.setorInformado || null,
      },
    });
  }
}