import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'
import http from '../api/http'

vi.mock('../api/http', () => ({
  default: { post: vi.fn() },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('login com sucesso salva token/user e persiste no localStorage', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: { access_token: 'abc123', user: { email: 'a@b.com' } },
    } as any)

    const store = useAuthStore()
    const ok = await store.login('a@b.com', 'senha')

    expect(ok).toBe(true)
    expect(store.token).toBe('abc123')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('auth_token')).toBe('abc123')
  })

  it('login com falha seta error e não autentica', async () => {
    vi.mocked(http.post).mockRejectedValue({
      response: { data: { message: 'Credenciais inválidas' } },
    })

    const store = useAuthStore()
    const ok = await store.login('a@b.com', 'errada')

    expect(ok).toBe(false)
    expect(store.error).toBe('Credenciais inválidas')
    expect(store.isAuthenticated).toBe(false)
  })

  it('logout limpa token/user e localStorage', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: { access_token: 'abc123', user: { email: 'a@b.com' } },
    } as any)

    const store = useAuthStore()
    await store.login('a@b.com', 'senha')
    store.logout()

    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })
})
