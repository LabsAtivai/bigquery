import  http  from './http'

// ajuste conforme seu endpoint real de upload
export function uploadImport(formData: FormData) {
  return http.post('/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function processImport(importId: string, mapping: any) {
  return http.post(`/imports/${importId}/process`, { mapping })
}
