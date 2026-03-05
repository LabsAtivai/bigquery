// src/api/http.ts
import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'https://api-leads.labsativa.com.br/')

const http = axios.create({
  baseURL,
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error)
    return Promise.reject(error)
  }
)

export default http
