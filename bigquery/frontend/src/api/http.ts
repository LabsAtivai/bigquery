import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://api-leads.labsativa.com.br/api'
    : 'http://localhost:3000')

const http = axios.create({ baseURL })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('API error:', e)

    if (e?.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }

    return Promise.reject(e)
  }
)

export default http