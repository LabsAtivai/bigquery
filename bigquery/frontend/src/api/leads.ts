import http from './http'

function buildQuery(params: any) {
  const query = new URLSearchParams()

  Object.entries(params || {}).forEach(([k, v]: any) => {
    if (Array.isArray(v)) {
      v.forEach((vv) => {
        if (vv !== undefined && vv !== null && String(vv) !== '') {
          query.append(`${k}[]`, String(vv)) // 🔥 padronizado com []
        }
      })
    } else if (v !== undefined && v !== null && String(v) !== '') {
      query.append(k, String(v))
    }
  })

  return query.toString()
}

export function getLeads(params: any) {
  const q = buildQuery(params)
  return http.get(`/leads?${q}`)
}

export function getFilters(params: any) {
  const q = buildQuery(params)
  return http.get(`/leads/filters?${q}`)
}

export function exportLeads(params: any) {
  const q = buildQuery(params)
  window.open(`${http.defaults.baseURL}/leads/export?${q}`)
}