import http from './http'

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
 * Extrair filename do header Content-Disposition
 */
function getFilenameFromHeaders(headers: any) {
  const cd =
    headers?.['content-disposition'] ||
    headers?.['Content-Disposition']

  if (!cd) return null

  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(cd)

  if (!match?.[1]) return null

  try {
    return decodeURIComponent(match[1].replace(/"/g, '').trim())
  } catch {
    return match[1].replace(/"/g, '').trim()
  }
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
 * Download de blob no browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename

  document.body.appendChild(a)
  a.click()

  a.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Exportar leads com filtros aplicados
 */
export async function exportLeads(params: any) {
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
    const blob = err?.response?.data

    // Backend pode retornar erro JSON dentro de blob
    if (blob instanceof Blob) {
      try {
        const text = await blob.text()
        const json = JSON.parse(text)

        return {
          ok: false,
          status: err?.response?.status,
          message: json?.message || text
        }
      } catch {
        return {
          ok: false,
          status: err?.response?.status,
          message: 'Falha ao exportar'
        }
      }
    }

    return {
      ok: false,
      status: err?.response?.status,
      message: err?.message || 'Falha ao exportar'
    }
  }
}
