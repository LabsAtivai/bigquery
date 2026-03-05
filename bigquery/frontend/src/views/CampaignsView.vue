<script setup lang="ts">
import { reactive, onMounted, watch } from 'vue'
import AppShell from '../components/AppShell.vue'
import { useCampaignsStore } from '../stores/campaigns.store'

const store = useCampaignsStore()

const query = reactive({
  name: '',
  user: '',
  client: '',
})

let t: any = null
watch(query, () => {
  clearTimeout(t)
  t = setTimeout(() => store.fetchCampaigns(query), 300)
}, { deep: true })

onMounted(() => store.fetchCampaigns(query))
</script>

<template>
  <AppShell>
    <div class="card">
      <div class="head">
        <div>
          <h2>Campanhas</h2>
          <p class="muted">Pesquise por nome, usuário ou cliente e faça download do arquivo gerado.</p>
        </div>
      </div>

      <div class="filters">
        <label>
          <span>Nome</span>
          <input v-model="query.name" placeholder="Ex: Adcont" />
        </label>
        <label>
          <span>Usuário</span>
          <input v-model="query.user" placeholder="Ex: charles" />
        </label>
        <label>
          <span>Cliente</span>
          <input v-model="query.client" placeholder="Ex: Adcont" />
        </label>
      </div>

      <div class="table-wrap" v-if="store.campaigns.length">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cliente</th>
              <th>Usuário</th>
              <th>Data</th>
              <th>Qtd Leads</th>
              <th>Arquivo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.campaigns" :key="c._id">
              <td>{{ c.name }}</td>
              <td>{{ c.client || '-' }}</td>
              <td>{{ c.created_by }}</td>
              <td>{{ new Date(c.created_at).toLocaleString() }}</td>
              <td>{{ c.leads_count }}</td>
              <td class="mono">{{ c.file?.filename }}</td>
              <td class="actions">
                <button class="btn-outline" @click="store.downloadCampaign(c._id, 'xlsx')">XLSX</button>
                <button class="btn-outline" @click="store.downloadCampaign(c._id, 'csv')">CSV</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty">
        <div class="muted" v-if="store.loading">Carregando…</div>
        <div class="muted" v-else>Nenhuma campanha encontrada.</div>
      </div>

      <div class="error" v-if="store.error">{{ store.error }}</div>
    </div>
  </AppShell>
</template>

<style scoped>
.card{
  background:#0f0f0f;
  border:1px solid var(--border);
  border-radius:16px;
  padding:16px;
  box-shadow: 0 25px 60px rgba(0,0,0,.35);
}
.head{ display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:14px; }
h2{ color: var(--accent); margin:0; font-size:22px; font-weight:900; }
.muted{ color: var(--muted); margin:6px 0 0 0; font-size:13px; }

.filters{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap:12px;
  margin-top:10px;
}
label{ display:flex; flex-direction:column; gap:6px; }
label span{ color: var(--muted); font-size:12px; }
input{
  padding:12px;
  border-radius:12px;
  border:1px solid var(--border);
  background:#0b0b0b;
  color: var(--text);
}

.table-wrap{
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow:auto;
  background: #0b0b0b;
}
table{ width: 100%; border-collapse: collapse; min-width: 960px; }
th{
  position: sticky; top:0;
  background:#0f0f0f;
  color: var(--accent);
  text-align:left;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  font-weight: 900;
  white-space: nowrap;
}
td{
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  color: var(--text);
  white-space: nowrap;
}
tr:hover td{ background: rgba(255,106,0,.06); }
.actions{ display:flex; gap:8px; }
.btn-outline{
  border: 1px solid rgba(255,106,0,.5);
  background: rgba(255,106,0,.08);
  color: var(--accent);
  font-weight: 800;
  padding: 8px 10px;
  border-radius: 12px;
  cursor:pointer;
}
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }
.empty{ padding: 16px; border:1px dashed var(--border); border-radius:16px; margin-top:14px; }
.error{ margin-top: 12px; color: #ff4d4d; font-weight: 800; }
</style>
