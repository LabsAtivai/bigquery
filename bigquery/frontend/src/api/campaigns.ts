import http from './http'
import {
  getFilenameFromHeaders,
  downloadBlob,
  extractBlobErrorMessage,
  type DownloadResult,
} from './download.util'

export function getCampaigns(params: any) {
  const filtered = Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, v]) => v !== undefined && v !== null && String(v) !== '',
    ),
  )
  const q = new URLSearchParams(filtered as Record<string, string>).toString()
  return http.get(`/campaigns?${q}`)
}

export function deleteCampaign(id: string) {
  return http.delete(`/campaigns/${id}`)
}

export async function downloadCampaign(id: string, format: 'csv' | 'xlsx'): Promise<DownloadResult> {
  try {
    const resp = await http.get(`/campaigns/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })

    const filename = getFilenameFromHeaders(resp.headers) || `campaign-${id}.${format}`
    downloadBlob(resp.data, filename)

    return { ok: true }
  } catch (err: any) {
    return extractBlobErrorMessage(err)
  }
}
