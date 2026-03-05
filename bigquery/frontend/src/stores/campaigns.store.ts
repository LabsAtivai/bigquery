import { defineStore } from 'pinia'
import { getCampaigns, downloadCampaign } from '../api/campaigns'

export const useCampaignsStore = defineStore('campaigns', {
  state: () => ({
    campaigns: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCampaigns(filters: any) {
      this.loading = true
      this.error = null
      try {
        const { data } = await getCampaigns(filters)
        this.campaigns = Array.isArray(data) ? data : (data?.data ?? [])
      } catch (err) {
        this.error = 'Erro ao carregar campanhas'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    downloadCampaign(id: string, format: 'csv' | 'xlsx') {
      downloadCampaign(id, format)
    },
  },
})