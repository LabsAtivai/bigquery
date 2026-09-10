import { defineStore } from 'pinia'
import http from '../api/http'

interface AuthUser {
  email: string
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') as string | null,
    user: loadUser(),
    loading: false,
    error: '' as string,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true
      this.error = ''

      try {
        const { data } = await http.post('/auth/login', { email, password })
        this.token = data.access_token
        this.user = data.user
        localStorage.setItem('auth_token', this.token as string)
        localStorage.setItem('auth_user', JSON.stringify(this.user))
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.message || 'E-mail ou senha inválidos.'
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
  },
})
