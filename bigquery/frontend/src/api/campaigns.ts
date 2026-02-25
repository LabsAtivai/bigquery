import http from './http'

export function listCampaigns(params: any) {
  return http.get('/campaigns', { params })
}

export function downloadCampaign(id: string, format: 'csv' | 'xlsx') {
  const base = http.defaults.baseURL || 'http://localhost:3000'
  window.open(`${base}/campaigns/${id}/export?format=${format}`)
}
