import { defineStore } from 'pinia'
import { getCampaigns, downloadCampaign, deleteCampaign } from '../api/campaigns'

export const useCampaignsStore = defineStore('campaigns', {
  state: () => ({
    campaigns: [] as any[],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 50,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCampaigns(filters: any) {
      this.loading = true
      this.error = null
      try {
        const { data } = await getCampaigns({ ...filters, page: this.page, limit: this.limit })
        if (Array.isArray(data)) {
          this.campaigns = data
          this.total = data.length
          this.totalPages = 1
        } else {
          this.campaigns = data?.data ?? []
          this.total = data?.total ?? this.campaigns.length
          this.totalPages = data?.totalPages ?? 1
        }
      } catch (err) {
        this.error = 'Erro ao carregar campanhas'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async applyFilters(filters: any) {
      this.page = 1
      await this.fetchCampaigns(filters)
    },

    async goToPage(page: number, filters: any) {
      if (page < 1) return
      if (this.totalPages && page > this.totalPages) return
      this.page = page
      await this.fetchCampaigns(filters)
    },

    async downloadCampaign(id: string, format: 'csv' | 'xlsx') {
      this.error = null
      const result = await downloadCampaign(id, format)
      if (!result.ok) {
        this.error = result.message || 'Erro ao baixar campanha'
      }
    },

    async deleteCampaign(id: string, filters: any) {
      this.error = null
      try {
        await deleteCampaign(id)
        await this.fetchCampaigns(filters)
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Erro ao excluir campanha'
      }
    },
  },
})
