import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { MongoService } from '../mongo/mongo.service'
import { ObjectId } from 'mongodb'
import type { Response } from 'express'
import * as csv from 'fast-csv'
import * as exceljs from 'exceljs'

@Injectable()
export class CampaignsService {
  constructor(private readonly mongoService: MongoService) {}

  // ✅ mantém padrão do export (mesmo do LeadsService)
  private readonly EXPORT_FIELDS = [
    'email',
    'nome',
    'nome_completo',
    'linkedin',
    'cargo',
    'pais',
    'localizacao',
    'empresa',
    'url_empresa',
    'tamanho',
    'pais_empresa',
    'localizacao_empresa',
    'estado_empresa',
    'cidade_empresa',
    'setor_empresa',
    'import_id',
    'updated_at',
  ]

  private pickExport(doc: any) {
    const out: any = {}
    for (const field of this.EXPORT_FIELDS) {
      out[field] = doc?.[field] ?? ''
    }
    return out
  }

  async createCampaign(data: {
    name: string
    client?: string | null
    created_by: string
    filters: any
    leads_count: number
    file: { type: string; filename: string; path: string | 'streamed' }
    meta?: {
      downloaded_by?: string | null
      setor_informado?: string | null
    }
  }) {
    const db = this.mongoService.getDb()

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
      })
    } catch (err) {
      throw new HttpException('Erro ao criar campanha', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async list(query: any) {
    const db = this.mongoService.getDb()
    const filter: any = {}

    if (query.client) filter.client = { $regex: String(query.client).trim(), $options: 'i' }
    if (query.name) filter.name = { $regex: String(query.name).trim(), $options: 'i' }
    if (query.user) filter.created_by = { $regex: String(query.user).trim(), $options: 'i' }

    return db.collection('campaigns').find(filter).sort({ created_at: -1 }).toArray()
  }

  async exportCampaignCSV(campaignId: string, res: Response) {
    const db = this.mongoService.getDb()

    const campaign = await db.collection('campaigns').findOne({
      _id: new ObjectId(campaignId),
    })

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND)
    }

    const filename =
      campaign?.file?.filename || `campaign-${campaignId}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const cursor = db.collection('leads').find(campaign.filters || {})

    // ✅ headers fixos e ordem garantida
    const csvStream = csv.format({
      headers: this.EXPORT_FIELDS,
      delimiter: ';',
    })

    csvStream.pipe(res)

    for await (const doc of cursor) {
      csvStream.write(this.pickExport(doc))
    }

    csvStream.end()
  }

  async exportCampaignXLSX(campaignId: string, res: Response) {
    const db = this.mongoService.getDb()

    const campaign = await db.collection('campaigns').findOne({
      _id: new ObjectId(campaignId),
    })

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND)
    }

    const filename =
      campaign?.file?.filename || `campaign-${campaignId}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const workbook = new exceljs.stream.xlsx.WorkbookWriter({ stream: res })
    const worksheet = workbook.addWorksheet('Leads')

    // ✅ cabeçalho fixo
    worksheet.addRow(this.EXPORT_FIELDS).commit()

    const cursor = db.collection('leads').find(campaign.filters || {})

    for await (const doc of cursor) {
      const row = this.pickExport(doc)
      worksheet.addRow(this.EXPORT_FIELDS.map((k) => row[k])).commit()
    }

    await workbook.commit()
  }
}