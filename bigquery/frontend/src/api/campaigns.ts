import http from './http'

export function getCampaigns(params: any) {
  return http.get('/campaigns', { params })
}

export function downloadCampaign(id: string, format: 'csv' | 'xlsx' = 'xlsx') {
  return http.get(`/campaigns/${id}/export`, {
    params: { format },
    responseType: 'blob',
  })
}