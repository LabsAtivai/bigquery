import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import { escapeRegex } from '../common/regex.util';
import { parseObjectId } from '../common/mongo-id.util';
import { streamCsv, streamXlsx } from '../common/export.util';
import { LEAD_EXPORT_FIELDS } from '../common/export-fields';
import type { Response } from 'express';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  // campanhas guardam metadados extras que leads avulsos não têm
  private readonly EXPORT_FIELDS = [
    ...LEAD_EXPORT_FIELDS,
    'import_id',
    'updated_at',
  ];

  constructor(private readonly mongoService: MongoService) {}

  async createCampaign(data: {
    name: string;
    client?: string | null;
    created_by: string;
    filters: any;
    leads_count: number;
    file: { type: string; filename: string; path: string | 'streamed' };
    meta?: {
      downloaded_by?: string | null;
      setor_informado?: string | null;
    };
  }) {
    const db = this.mongoService.getDb();

    try {
      await db.collection('campaigns').insertOne({
        name: data.name,
        client: data.client || null,
        created_at: new Date(),
        created_by: data.created_by,
        filters: data.filters,
        leads_count: data.leads_count,
        file: data.file,
        meta: {
          downloaded_by: data.meta?.downloaded_by || null,
          setor_informado: data.meta?.setor_informado || null,
        },
      });
    } catch (err) {
      this.logger.error(
        'Erro ao criar campanha',
        err instanceof Error ? err.stack : err,
      );
      throw new HttpException(
        'Erro ao criar campanha',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async list(query: any) {
    const db = this.mongoService.getDb();
    const filter: any = {};

    if (query.client)
      filter.client = {
        $regex: escapeRegex(String(query.client).trim()),
        $options: 'i',
      };
    if (query.name)
      filter.name = {
        $regex: escapeRegex(String(query.name).trim()),
        $options: 'i',
      };
    if (query.user)
      filter.created_by = {
        $regex: escapeRegex(String(query.user).trim()),
        $options: 'i',
      };

    const page =
      Number.isFinite(Number(query.page)) && Number(query.page) > 0
        ? Number(query.page)
        : 1;
    const limit =
      Number.isFinite(Number(query.limit)) && Number(query.limit) > 0
        ? Number(query.limit)
        : 50;
    const skip = (page - 1) * limit;

    const total = await db.collection('campaigns').countDocuments(filter);

    const data = await db
      .collection('campaigns')
      .find(filter)
      .sort({ created_at: -1 })
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

  async remove(campaignId: string) {
    const objectId = parseObjectId(campaignId, 'campanha');
    const db = this.mongoService.getDb();

    const result = await db
      .collection('campaigns')
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    return { deleted: true };
  }

  async exportCampaignCSV(campaignId: string, res: Response) {
    const objectId = parseObjectId(campaignId, 'campanha');
    const db = this.mongoService.getDb();

    const campaign = await db
      .collection('campaigns')
      .findOne({ _id: objectId });

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    const filename = campaign?.file?.filename || `campaign-${campaignId}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const cursor = db.collection('leads').find(campaign.filters || {});

    try {
      await streamCsv(res, this.EXPORT_FIELDS, cursor);
    } catch (err) {
      this.logger.error(
        'Erro ao gerar CSV da campanha',
        err instanceof Error ? err.stack : err,
      );
      // a resposta já começou a ser enviada em streaming; não dá para
      // trocar por um HttpException nesse ponto sem quebrar o protocolo HTTP
      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Erro ao exportar campanha' });
      } else {
        res.end();
      }
    }
  }

  async exportCampaignXLSX(campaignId: string, res: Response) {
    const objectId = parseObjectId(campaignId, 'campanha');
    const db = this.mongoService.getDb();

    const campaign = await db
      .collection('campaigns')
      .findOne({ _id: objectId });

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    const filename = campaign?.file?.filename || `campaign-${campaignId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const cursor = db.collection('leads').find(campaign.filters || {});

    try {
      await streamXlsx(this.EXPORT_FIELDS, cursor, { stream: res });
    } catch (err) {
      this.logger.error(
        'Erro ao gerar XLSX da campanha',
        err instanceof Error ? err.stack : err,
      );
      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Erro ao exportar campanha' });
      } else {
        res.end();
      }
    }
  }
}
