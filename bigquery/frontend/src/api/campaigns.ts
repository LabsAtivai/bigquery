import http from './http'

export function getCampaigns(params: any) {
  const q = new URLSearchParams(params || {}).toString()
  return http.get(`/campaigns?${q}`)
}

export function downloadCampaign(id: string, format: 'csv' | 'xlsx') {
  const base = http.defaults.baseURL || 'http://localhost:3000'
  window.open(`${base}/campaigns/${id}/export?format=${format}`)
}