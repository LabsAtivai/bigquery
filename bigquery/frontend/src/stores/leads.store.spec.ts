import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeadsStore } from './leads.store'
import * as leadsApi from '../api/leads'

vi.mock('../api/leads', () => ({
  getLeads: vi.fn(),
  getFilters: vi.fn(),
}))

describe('useLeadsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchLeads: sucesso preenche leads/total/totalPages e limpa error', async () => {
    vi.mocked(leadsApi.getLeads).mockResolvedValue({
      data: { data: [{ _id: '1' }], total: 1, totalPages: 1 },
    } as any)

    const store = useLeadsStore()
    await store.fetchLeads({})

    expect(store.leads).toEqual([{ _id: '1' }])
    expect(store.total).toBe(1)
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
  })

  it('fetchLeads: erro seta store.error e mantém leads vazio', async () => {
    vi.mocked(leadsApi.getLeads).mockRejectedValue({
      response: { data: { message: 'Falha X' } },
    })

    const store = useLeadsStore()
    await store.fetchLeads({})

    expect(store.error).toBe('Falha X')
    expect(store.leads).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('applyFilters reseta a página para 1', async () => {
    vi.mocked(leadsApi.getLeads).mockResolvedValue({
      data: { data: [], total: 0, totalPages: 0 },
    } as any)

    const store = useLeadsStore()
    store.page = 3
    await store.applyFilters({})

    expect(store.page).toBe(1)
  })

  it('goToPage não avança além de totalPages', async () => {
    vi.mocked(leadsApi.getLeads).mockResolvedValue({
      data: { data: [], total: 10, totalPages: 2 },
    } as any)

    const store = useLeadsStore()
    await store.fetchLeads({})
    await store.goToPage(5, {})

    expect(store.page).toBe(1)
  })

  it('exportError é independente de error (item da auditoria: mutação de state fora das actions)', () => {
    const store = useLeadsStore()
    store.setExportError('erro de export')
    store.setError('erro de listagem')

    expect(store.exportError).toBe('erro de export')
    expect(store.error).toBe('erro de listagem')

    store.clearExportError()
    expect(store.exportError).toBe('')
    expect(store.error).toBe('erro de listagem')
  })
})
