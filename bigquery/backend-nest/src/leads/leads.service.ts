import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { escapeRegex } from '../common/regex.util';
import { sanitizeFilename } from '../common/filename.util';
import { parseObjectId } from '../common/mongo-id.util';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { streamCsv, streamXlsx } from '../common/export.util';
import { LEAD_EXPORT_FIELDS } from '../common/export-fields';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private mongoService: MongoService,
    private campaignsService: CampaignsService,
  ) {}

  private getQueryRaw(query: any, key: string) {
    if (!query) return undefined;
    return query[key] ?? query[`${key}[]`];
  }

  private normalizeArrayFromQuery(query: any, key: string): string[] {
    const raw = this.getQueryRaw(query, key);
    if (raw === undefined || raw === null) return [];

    if (Array.isArray(raw)) {
      return raw
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const s = String(raw).trim();
    if (!s) return [];

    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private normalizeNumber(raw: any, fallback: number) {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  private normalizeLeadsQuery(query: any) {
    const normalized = {
      ...query,

      setor_empresa: this.normalizeArrayFromQuery(query, 'setor_empresa'),
      estado_empresa: this.normalizeArrayFromQuery(query, 'estado_empresa'),
      cidade_empresa: this.normalizeArrayFromQuery(query, 'cidade_empresa'),
      pais_empresa: this.normalizeArrayFromQuery(query, 'pais_empresa'),
      tamanho: this.normalizeArrayFromQuery(query, 'tamanho'),
      cargo: this.normalizeArrayFromQuery(query, 'cargo'),
      client: this.normalizeArrayFromQuery(query, 'client'),

      page: this.normalizeNumber(query?.page, 1),
      limit: this.normalizeNumber(query?.limit, 50),
    };

    return normalized;
  }

  private removeFieldFromQuery(query: any, field: string) {
    const q = { ...query };
    delete q[field];
    delete q[`${field}[]`];
    return q;
  }

  private buildMongoFilter(query: any) {
    const filter: any = {};

    const addFilter = (field: string, values: string[]) => {
      if (!values || values.length === 0) return;

      if (values.length === 1) {
        filter[field] = { $regex: escapeRegex(values[0]), $options: 'i' };
        return;
      }

      filter[field] = { $in: values };
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

  private readonly FILTERABLE_FIELDS = [
    'setor_empresa',
    'estado_empresa',
    'cidade_empresa',
    'pais_empresa',
    'tamanho',
    'cargo',
    'client',
  ];

  private baseFilterExcluding(normalized: any, excludeField?: string) {
    let q = { ...normalized };

    if (excludeField) {
      q = this.removeFieldFromQuery(q, excludeField);
      q[excludeField] = [];
    }

    return this.buildMongoFilter(q);
  }

  async getFilters(query: any) {
    const db = this.mongoService.getDb();
    const normalized = this.normalizeLeadsQuery(query);

    const aggregateField = async (field: string) => {
      const result = await db
        .collection('leads')
        .aggregate([
          { $match: this.baseFilterExcluding(normalized, field) },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 200 },
        ])
        .toArray();

      return result.filter((x: any) => x._id && String(x._id).trim() !== 'NAN');
    };

    const [setores, estados, cidades, paises, tamanhos, cargos, clientes] =
      await Promise.all([
        aggregateField('setor_empresa'),
        aggregateField('estado_empresa'),
        aggregateField('cidade_empresa'),
        aggregateField('pais_empresa'),
        aggregateField('tamanho'),
        aggregateField('cargo'),
        aggregateField('client'),
      ]);

    return { setores, estados, cidades, paises, tamanhos, cargos, clientes };
  }

  /**
   * Busca valores distintos de um campo de filtro por texto digitado,
   * sem se limitar ao top-200 por frequência (usado pelo autocomplete
   * de cargos, que tem alta cardinalidade e cauda longa).
   */
  async searchFieldValues(field: string, q: string, query: any) {
    if (!this.FILTERABLE_FIELDS.includes(field)) {
      throw new HttpException(
        'Campo de filtro inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const db = this.mongoService.getDb();
    const normalized = this.normalizeLeadsQuery(query);
    const term = String(q || '').trim();

    const pipeline: any[] = [
      { $match: this.baseFilterExcluding(normalized, field) },
    ];

    if (term) {
      pipeline.push({
        $match: { [field]: { $regex: escapeRegex(term), $options: 'i' } },
      });
    }

    pipeline.push(
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    );

    const result = await db.collection('leads').aggregate(pipeline).toArray();
    return result.filter((x: any) => x._id && String(x._id).trim() !== 'NAN');
  }

  async findAll(query: any) {
    const db = this.mongoService.getDb();
    const normalized = this.normalizeLeadsQuery(query);

    const page = normalized.page;
    const limit = normalized.limit;
    const skip = (page - 1) * limit;

    const filter = this.buildMongoFilter(normalized);

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

  async update(id: string, data: UpdateLeadDto) {
    const db = this.mongoService.getDb();
    const objectId = parseObjectId(id, 'lead');

    const updates = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    if (Object.keys(updates).length === 0) {
      throw new HttpException(
        'Nenhum campo para atualizar',
        HttpStatus.BAD_REQUEST,
      );
    }

    let result;
    try {
      result = await db
        .collection('leads')
        .findOneAndUpdate(
          { _id: objectId },
          { $set: { ...updates, updated_at: new Date() } },
          { returnDocument: 'after' },
        );
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new HttpException(
          'Já existe um lead com esse e-mail',
          HttpStatus.CONFLICT,
        );
      }
      this.logger.error(
        'Erro ao atualizar lead',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao atualizar lead',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!result) {
      throw new HttpException('Lead não encontrado', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async remove(id: string) {
    const db = this.mongoService.getDb();
    const objectId = parseObjectId(id, 'lead');

    const result = await db.collection('leads').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new HttpException('Lead não encontrado', HttpStatus.NOT_FOUND);
    }

    return { deleted: true };
  }

  async export(query: any, res: Response) {
    const normalized = this.normalizeLeadsQuery(query);
    const format = String(query.format || 'xlsx').toLowerCase();

    if (format === 'csv') return this.exportCSV(normalized, res);
    return this.exportXLSX(normalized, res);
  }

  private async prepareExport(query: any) {
    const db = this.mongoService.getDb();
    const filter = this.buildMongoFilter(query);

    const total = await db.collection('leads').countDocuments(filter);

    const exportDir = path.join(
      process.cwd(),
      'exports',
      new Date().toISOString().split('T')[0],
    );
    await fs.promises.mkdir(exportDir, { recursive: true });

    return { db, filter, total, exportDir };
  }

  private async registerExportCampaign(
    query: any,
    total: number,
    file: { type: 'csv' | 'xlsx'; filename: string; path: string },
  ) {
    await this.campaignsService.createCampaign({
      name: query.campaignName || 'Export',
      client: query.clientName || query.client?.[0] || null,
      created_by: query.user || 'sistema',
      filters: this.sanitizeCampaignFilters(query),
      leads_count: total,
      file,
      meta: {
        downloaded_by: query.downloadedBy || null,
        setor_informado: query.setorInformado || null,
      },
    });
  }

  async exportXLSX(query: any, res: Response) {
    const { db, filter, total, exportDir } = await this.prepareExport(query);

    if (!total)
      return res.status(404).json({ message: 'Nenhum lead encontrado' });

    const filename = `${sanitizeFilename(query.campaignName)}-${Date.now()}.xlsx`;
    const filepath = path.join(exportDir, filename);

    const cursor = db.collection('leads').find(filter);
    try {
      await streamXlsx(LEAD_EXPORT_FIELDS, cursor, { filename: filepath });
    } catch (err) {
      this.logger.error(
        'Erro ao gerar XLSX de export',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao exportar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.registerExportCampaign(query, total, {
      type: 'xlsx',
      filename,
      path: filepath,
    });

    return res.download(filepath);
  }

  async exportCSV(query: any, res: Response) {
    const { db, filter, total, exportDir } = await this.prepareExport(query);

    if (!total)
      return res.status(404).json({ message: 'Nenhum lead encontrado' });

    const filename = `${sanitizeFilename(query.campaignName)}-${Date.now()}.csv`;
    const filepath = path.join(exportDir, filename);

    const cursor = db.collection('leads').find(filter);
    try {
      await streamCsv(
        fs.createWriteStream(filepath),
        LEAD_EXPORT_FIELDS,
        cursor,
      );
    } catch (err) {
      this.logger.error(
        'Erro ao gerar CSV de export',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao exportar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.registerExportCampaign(query, total, {
      type: 'csv',
      filename,
      path: filepath,
    });

    return res.download(filepath);
  }
}
