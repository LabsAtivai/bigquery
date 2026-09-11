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
    exportError: '' as string,
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

    /** Reseta para a primeira página ao aplicar um novo conjunto de filtros */
    async applyFilters(filters: any) {
      this.page = 1
      await this.fetchLeads(filters)
    },

    async goToPage(page: number, filters: any) {
      if (page < 1) return
      if (this.totalPages && page > this.totalPages) return
      this.page = page
      await this.fetchLeads(filters)
    },

    async setLimit(limit: number, filters: any) {
      this.limit = limit
      this.page = 1
      await this.fetchLeads(filters)
    },

    setExportError(message: string) {
      this.exportError = message
    },

    clearExportError() {
      this.exportError = ''
    },

    setError(message: string) {
      this.error = message
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