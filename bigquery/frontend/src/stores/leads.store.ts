import { defineStore } from 'pinia'
import { getLeads, exportLeads } from '../api/leads'

export const useLeadsStore = defineStore('leads', {
  state: () => ({
    leads: [] as any[],
    total: 0,
    filters: {} as any,
    loading: false,
    exporting: false,
    error: null as string | null,
  }),

  actions: {
    async fetchLeads(filters: any) {
      this.loading = true
      this.error = null
      try {
        const { data } = await getLeads(filters)
        this.leads = data.data
        this.total = data.total
        this.filters = filters
      } catch (err) {
        this.error = 'Erro ao carregar leads'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async exportLeads(filters: any, campaignName: string, format: 'csv' | 'xlsx') {
      this.exporting = true
      this.error = null
      try {
        const params = { ...filters, campaignName, format }
        const response = await exportLeads(params)
        const blob = response.data
        const filename = response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || `${campaignName}.${format}`
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.error = 'Erro ao exportar leads'
        console.error(err)
      } finally {
        this.exporting = false
      }
    },
  },
})