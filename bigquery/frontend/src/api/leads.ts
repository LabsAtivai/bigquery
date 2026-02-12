import http from './http'

export function getLeads(params: any) {
  return http.get('/leads', { params })
}

export function exportLeads(params: any) {
  return http.get('/leads/export', {
    params,
    responseType: 'blob',
  })
}

export function getFilters(params: any) {
  return http.get('/leads/filters', { params })  // Params serializados automaticamente pelo Axios
}