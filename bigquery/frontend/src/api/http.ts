import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://api-leads.labsativa.com.br/api'
    : 'http://localhost:3000')

const http = axios.create({ baseURL })

http.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('API error:', e)
    return Promise.reject(e)
  }
)

export default http