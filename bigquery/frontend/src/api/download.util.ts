export type DownloadResult = { ok: true } | { ok: false; status?: number; message: string }

/**
 * Extrai o filename do header Content-Disposition
 */
export function getFilenameFromHeaders(headers: any) {
  const cd = headers?.['content-disposition'] || headers?.['Content-Disposition']

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
 * Download de blob no browser
 */
export function downloadBlob(blob: Blob, filename: string) {
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
 * Extrai a mensagem de erro quando o backend retorna um blob (não JSON) de erro
 */
export async function extractBlobErrorMessage(
  err: any,
): Promise<{ ok: false; status?: number; message: string }> {
  const blob = err?.response?.data

  if (blob instanceof Blob) {
    try {
      const text = await blob.text()
      const json = JSON.parse(text)
      return { ok: false, status: err?.response?.status, message: json?.message || text }
    } catch {
      return { ok: false, status: err?.response?.status, message: 'Falha ao exportar' }
    }
  }

  return {
    ok: false,
    status: err?.response?.status,
    message: err?.message || 'Falha ao exportar',
  }
}
