<script setup lang="ts">
import { reactive, onMounted, watch } from 'vue'
import { useCampaignsStore } from '../stores/campaigns.store'

const store = useCampaignsStore()
const filters = reactive({
  name: '',
  user: '',
  client: ''
})

async function loadCampaigns() {
  await store.fetchCampaigns(filters)
}

watch(filters, () => loadCampaigns(), { deep: true })

onMounted(loadCampaigns)
</script>

<template>
  <div class="campaigns-page">
    <h2>Campanhas</h2>

    <!-- 🔎 Filtros -->
    <div class="filters">
      <input v-model="filters.client" placeholder="Cliente" />
      <input v-model="filters.name" placeholder="Nome da campanha" />
      <input v-model="filters.user" placeholder="Usuário" />
    </div>

    <!-- 📊 Tabela -->
    <div class="table-container">
      <table v-if="store.campaigns.length">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cliente</th>
            <th>Usuário</th>
            <th>Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="campaign in store.campaigns" :key="campaign._id">
            <td>{{ campaign.name }}</td>
            <td>{{ campaign.filters?.client || '-' }}</td>
            <td>{{ campaign.created_by }}</td>
            <td>{{ campaign.leads_count }}</td>
            <td class="actions">
              <button class="btn-export" @click="store.downloadCampaign(campaign._id, 'xlsx')">XLSX</button>
              <button class="btn-export" @click="store.downloadCampaign(campaign._id, 'csv')">CSV</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="!store.loading" class="empty">Nenhuma campanha encontrada.</div>
      <div v-if="store.loading" class="loading">Carregando campanhas...</div>
      <p v-if="store.error" class="error">{{ store.error }}</p>
    </div>
  </div>
</template>

<style scoped>
.campaigns-page {
  width: 100%;
}

h2 {
  color: #ff6a00;
  font-size: 1.8rem;
  margin-bottom: 25px;
}

/* 🔎 filtros */
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333333;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: #ff6a00;
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.15);
}

/* 📊 tabela */
.table-container {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

thead th {
  background: #111111;
  color: #ff6a00;
  text-align: left;
  padding: 14px 16px;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

tbody tr {
  transition: background 0.2s;
}

tbody tr:nth-child(even) {
  background: #141414;
}

tbody tr:hover {
  background: #222222;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #222222;
}

.actions {
  display: flex;
  gap: 10px;
}

/* 🔘 botão export */
.btn-export {
  background: #ff6a00;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s;
}

.btn-export:hover {
  background: #ff8533;
  transform: translateY(-1px);
}

/* estados */
.empty {
  padding: 20px;
  text-align: center;
  color: #aaaaaa;
  font-style: italic;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #ff6a00;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.error {
  color: #ff0000;
  text-align: center;
  margin-top: 10px;
}

/* 📱 responsivo */
@media (max-width: 768px) {
  table {
    font-size: 13px;
  }

  input {
    font-size: 13px;
  }

  .actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>