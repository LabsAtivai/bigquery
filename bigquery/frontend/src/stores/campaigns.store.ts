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
        this.campaigns = data
      } catch (err) {
        this.error = 'Erro ao carregar campanhas'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async downloadCampaign(id: string, format: 'csv' | 'xlsx') {
      this.loading = true
      this.error = null
      try {
        const response = await downloadCampaign(id, format)
        const blob = response.data
        const filename = response.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || `campaign-${id}.${format}`
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.error = 'Erro ao baixar campanha'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
  },
})