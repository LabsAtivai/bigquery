import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

http.interceptors.request.use(config => {
  // Futuro: add token auth aqui
  return config;
});

http.interceptors.response.use(response => response, error => {
  console.error('API error:', error);
  return Promise.reject(error);
});

export default http