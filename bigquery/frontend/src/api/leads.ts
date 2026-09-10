import http from './http'
import {
  getFilenameFromHeaders,
  downloadBlob,
  extractBlobErrorMessage,
  type DownloadResult,
} from './download.util'

function buildQuery(params: any) {
  const query = new URLSearchParams()

  Object.entries(params || {}).forEach(([k, v]: any) => {
    if (Array.isArray(v)) {
      v.forEach((vv) => {
        if (vv !== undefined && vv !== null && String(vv) !== '') {
          query.append(`${k}[]`, String(vv))
        }
      })
    } else if (v !== undefined && v !== null && String(v) !== '') {
      query.append(k, String(v))
    }
  })

  return query.toString()
}

/**
 * Buscar leads
 */
export function getLeads(params: any) {
  const q = buildQuery(params)
  return http.get(`/leads?${q}`)
}

/**
 * Buscar opções de filtros
 */
export function getFilters(params: any) {
  const q = buildQuery(params)
  return http.get(`/leads/filters?${q}`)
}

/**
 * Buscar valores de um campo de filtro por texto digitado (autocomplete
 * server-side, não se limita ao top-200 por frequência)
 */
export function searchFilterField(field: string, term: string, params: any = {}) {
  const q = buildQuery({ ...params, q: term })
  return http.get(`/leads/filters/${field}?${q}`)
}

/**
 * Nome fallback caso backend não envie filename
 */
function fallbackFilename(params: any) {
  const name = String(params?.campaignName || 'export')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')

  const format = params?.format === 'csv' ? 'csv' : 'xlsx'

  return `${name}.${format}`
}

/**
 * Exportar leads com filtros aplicados
 */
export async function exportLeads(params: any): Promise<DownloadResult> {
  try {
    const resp = await http.get('/leads/export', {
      params,
      responseType: 'blob'
    })

    const filename =
      getFilenameFromHeaders(resp.headers) ||
      fallbackFilename(params)

    downloadBlob(resp.data, filename)

    return { ok: true }

  } catch (err: any) {
    return extractBlobErrorMessage(err)
  }
}

/**
 * Editar campos de um lead
 */
export function updateLead(id: string, data: Record<string, string>) {
  return http.patch(`/leads/${id}`, data)
}

/**
 * Excluir um lead
 */
export function deleteLead(id: string) {
  return http.delete(`/leads/${id}`)
}
