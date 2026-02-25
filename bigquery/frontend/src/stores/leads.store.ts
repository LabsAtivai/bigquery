import { defineStore } from 'pinia'
import { getLeads, getFilters } from '../api/leads'

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    leads: [] as any[],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 50,
    loading: false,
    error: '' as string,
    filterOptions: {} as Record<string, { _id: string; count: number }[]>,
    filtersLoading: false,
  }),

  actions: {
    async fetchLeads(filters: any) {
      this.loading = true
      this.error = ''

      try {
        const { data } = await getLeads({
          ...filters,
          page: this.page,
          limit: this.limit,
        })

        this.leads = data.data || []
        this.total = data.total || 0
        this.totalPages = data.totalPages || 0

      } catch (e: any) {
        console.error('[fetchLeads] erro:', e?.response?.data || e)
        this.error =
          e?.response?.data?.message || 'Erro ao carregar leads.'
      } finally {
        this.loading = false
      }
    },

    async fetchFilters(filters: any) {
      this.filtersLoading = true

      try {
        const { data } = await getFilters(filters)
        this.filterOptions = data || {}
      } catch (e) {
        console.error('[fetchFilters] erro:', e)
        this.filterOptions = {}
      } finally {
        this.filtersLoading = false
      }
    },
  },
})