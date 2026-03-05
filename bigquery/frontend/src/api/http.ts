// src/api/http.ts
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''  // força /api em todos os ambientes

const http = axios.create({
  baseURL,
  // Opcional: timeout maior se o backend demorar
  timeout: 30000,
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error)
    // Opcional: tratar 401/403 aqui (ex: logout)
    return Promise.reject(error)
  }
)

export default http
