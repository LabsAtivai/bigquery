import { Injectable } from '@nestjs/common'
import { MongoService } from '../mongo/mongo.service'
import { CampaignsService } from '../campaigns/campaigns.service'
import type { Response } from 'express'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class LeadsService {
  constructor(
    private mongoService: MongoService,
    private campaignsService: CampaignsService,
  ) {}

  private getQueryRaw(query: any, key: string) {
    if (!query) return undefined
    return query[key] ?? query[`${key}[]`]
  }

  private normalizeArrayFromQuery(query: any, key: string): string[] {
    const raw = this.getQueryRaw(query, key)
    if (raw === undefined || raw === null) return []

    if (Array.isArray(raw)) {
      return raw.map(String).map((s) => s.trim()).filter(Boolean)
    }

    const s = String(raw).trim()
    if (!s) return []

    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }

  private normalizeNumber(raw: any, fallback: number) {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : fallback
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
    }

    return normalized
  }

  private removeFieldFromQuery(query: any, field: string) {
    const q = { ...query }
    delete q[field]
    delete q[`${field}[]`]
    return q
  }

  private buildMongoFilter(query: any) {
    const filter: any = {}

    const addFilter = (field: string, values: string[]) => {
      if (!values || values.length === 0) return

      if (values.length === 1) {
        filter[field] = { $regex: values[0], $options: 'i' }
        return
      }

      filter[field] = { $in: values }
    }

    addFilter('setor_empresa', query.setor_empresa)
    addFilter('estado_empresa', query.estado_empresa)
    addFilter('cidade_empresa', query.cidade_empresa)
    addFilter('pais_empresa', query.pais_empresa)
    addFilter('tamanho', query.tamanho)
    addFilter('cargo', query.cargo)
    addFilter('client', query.client)

    console.log('[DEBUG Backend] Filtro Mongo gerado:', JSON.stringify(filter, null, 2))
    return filter
  }

  private sanitizeCampaignFilters(query: any) {
    return this.buildMongoFilter(query)
  }

  private csvEscape(value: any) {
    if (value === undefined || value === null) return ''
    const s = String(value)
    const needsQuotes = /[",;\n\r]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }

  async getFilters(query: any) {
    const db = this.mongoService.getDb()
    const normalized = this.normalizeLeadsQuery(query)

    const baseFilter = (excludeField?: string) => {
      let q = { ...normalized }

      if (excludeField) {
        q = this.removeFieldFromQuery(q, excludeField)
        ;(q as any)[excludeField] = []
      }

      return this.buildMongoFilter(q)
    }

    const aggregateField = async (field: string) => {
      const result = await db
        .collection('leads')
        .aggregate([
          { $match: baseFilter(field) },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 200 },
        ])
        .toArray()

      return result.filter((x: any) => x._id && String(x._id).trim() !== 'NAN')
    }

    const [setores, estados, cidades, paises, tamanhos, cargos, clientes] =
      await Promise.all([
        aggregateField('setor_empresa'),
        aggregateField('estado_empresa'),
        aggregateField('cidade_empresa'),
        aggregateField('pais_empresa'),
        aggregateField('tamanho'),
        aggregateField('cargo'),
        aggregateField('client'),
      ])

    return { setores, estados, cidades, paises, tamanhos, cargos, clientes }
  }

  async findAll(query: any) {
    const db = this.mongoService.getDb()
    const normalized = this.normalizeLeadsQuery(query)

    const page = normalized.page
    const limit = normalized.limit
    const skip = (page - 1) * limit

    const filter = this.buildMongoFilter(normalized)

    const total = await db.collection('leads').countDocuments(filter)

    const data = await db
      .collection('leads')
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    }
  }

  async export(query: any, res: Response) {
    const normalized = this.normalizeLeadsQuery(query)
    const format = String(query.format || 'xlsx').toLowerCase()

    if (format === 'csv') return this.exportCSV(normalized, res)
    return this.exportXLSX(normalized, res)
  }

  async exportXLSX(query: any, res: Response) {
    const db = this.mongoService.getDb()

    const filter = this.buildMongoFilter(query)
    const leads = await db.collection('leads').find(filter).toArray()

    if (!leads.length)
      return res.status(404).json({ message: 'Nenhum lead encontrado' })

    const cleaned = leads.map((lead) => {
      const { _id, ...rest } = lead || {}
      return rest
    })

    const today = new Date().toISOString().split('T')[0]
    const exportDir = path.join(process.cwd(), 'exports', today)
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true })

    const filename =
      (query.campaignName || 'export')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') +
      '-' +
      Date.now() +
      '.xlsx'

    const filepath = path.join(exportDir, filename)

    const worksheet = XLSX.utils.json_to_sheet(cleaned)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
    XLSX.writeFile(workbook, filepath)

    await this.campaignsService.createCampaign({
      name: query.campaignName || 'Export',
      client: query.clientName || query.client?.[0] || null,
      created_by: query.user || 'sistema',
      filters: this.sanitizeCampaignFilters(query),
      leads_count: cleaned.length,
      file: { type: 'xlsx', filename, path: filepath },
      meta: {
        downloaded_by: query.downloadedBy || null,
        setor_informado: query.setorInformado || null,
      },
    })

    return res.download(filepath)
  }

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
  ]

  async exportCSV(query: any, res: Response) {
    const db = this.mongoService.getDb()

    const filter = this.buildMongoFilter(query)
    const leads = await db.collection('leads').find(filter).toArray()

    if (!leads.length)
      return res.status(404).json({ message: 'Nenhum lead encontrado' })

    const cleaned = leads.map((lead) => {
      const obj: any = {}

      this.EXPORT_FIELDS.forEach((field) => {
        obj[field] = lead?.[field] ?? ''
      })

      return obj
    })

    const keys = this.EXPORT_FIELDS
    const header = keys.join(';')
    const rows = cleaned.map((obj) =>
      keys.map((k) => this.csvEscape(obj?.[k])).join(';'),
    )
    const csv = [header, ...rows].join('\n')

    const today = new Date().toISOString().split('T')[0]
    const exportDir = path.join(process.cwd(), 'exports', today)
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true })

    const filename =
      (query.campaignName || 'export')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') +
      '-' +
      Date.now() +
      '.csv'

    const filepath = path.join(exportDir, filename)
    fs.writeFileSync(filepath, csv, 'utf-8')

    await this.campaignsService.createCampaign({
      name: query.campaignName || 'Export',
      client: query.clientName || query.client?.[0] || null,
      created_by: query.user || 'sistema',
      filters: this.sanitizeCampaignFilters(query),
      leads_count: cleaned.length,
      file: { type: 'csv', filename, path: filepath },
      meta: {
        downloaded_by: query.downloadedBy || null,
        setor_informado: query.setorInformado || null,
      },
    })

    return res.download(filepath)
  }
}