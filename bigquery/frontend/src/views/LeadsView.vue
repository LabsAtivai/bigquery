<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { useLeadsStore } from '../stores/leads.store'
import { getFilters } from '../api/leads'
import SearchSelect from '../components/SearchSelect.vue'
import ExportModal from '../components/ExportModal.vue'

const store = useLeadsStore()
const showModal = ref(false)
const filtersLoading = ref(true)
const filterOptions = ref<any>({})

const filterOrder = [
  { key: 'setor_empresa', label: 'Setor', optionsKey: 'setores' },
  { key: 'estado_empresa', label: 'Estado', optionsKey: 'estados' },
  { key: 'cidade_empresa', label: 'Cidade', optionsKey: 'cidades' },
  { key: 'pais_empresa', label: 'País', optionsKey: 'paises' },
  { key: 'tamanho', label: 'Porte', optionsKey: 'tamanhos' },
  { key: 'cargo', label: 'Cargo', optionsKey: 'cargos' },
  { key: 'client', label: 'Cliente', optionsKey: 'clientes' }
]

const fixedColumns = [
  'email',
  'nome',
  'nome_completo',
  'linkedin',
  'cargo',
  'pais',
  'localizacao',
  'empresa',
  'url_empresa',
  'tamanho',
  'pais_empresa',
  'localizacao_empresa',
  'estado_empresa',
  'cidade_empresa',
  'setor_empresa'
]

const filters = reactive({
  setor_empresa: [] as string[],
  estado_empresa: [] as string[],
  cidade_empresa: [] as string[],
  pais_empresa: [] as string[],
  tamanho: [] as string[],
  cargo: [] as string[],
  client: [] as string[]
})

function handleExport(meta: {
  campaignName: string
  format: 'xlsx' | 'csv'
  downloadedBy: string
  clientName: string
  setorInformado: string
  user: string
}) {
  exportLeads({
    ...filters,           // ✅ filtros atuais
    ...meta,              // ✅ meta do modal
    page: undefined,      // ✅ opcional: remove
    limit: undefined,     // ✅ opcional: remove
  })
}

watch(filters, (newVal) => {
  console.log('[DEBUG] Filtros alterados:', JSON.stringify(newVal, null, 2))
}, { deep: true })

async function loadFilters() {
  filtersLoading.value = true
  try {
    console.log('[DEBUG] Carregando filtros...')
    const { data } = await getFilters(filters)
    console.log('[DEBUG] Filtros recebidos:', data)
    filterOptions.value = data || {}
  } catch (err) {
    console.error('Erro ao carregar filtros:', err)
    store.error = 'Erro ao carregar opções de filtro.'
  } finally {
    filtersLoading.value = false
  }
}

async function loadLeads() {
  console.log('[DEBUG] Filtrando com:', JSON.stringify(filters, null, 2))
  try {
    await store.fetchLeads(filters)
    console.log('[DEBUG] Leads atualizados. Total:', store.total)
  } catch (err) {
    console.error('Erro ao carregar leads:', err)
    store.error = 'Erro ao filtrar leads.'
  }
}

onMounted(async () => {
  await loadFilters()
  await loadLeads()
})
</script>

<template>
  <div class="page">
    <h2>Leads</h2>

    <div class="filters-bar">
      <div v-if="filtersLoading" class="loading">Carregando filtros...</div>
      <div v-else-if="Object.keys(filterOptions).length === 0" class="empty">
        Nenhuma opção de filtro disponível.
      </div>
      <div v-else class="filter-group">
        <SearchSelect
          v-for="item in filterOrder"
          :key="item.key"
          v-model="filters[item.key]"
          :options="filterOptions[item.optionsKey] || []"
          :placeholder="item.label"
          multiple
        />
      </div>

      <div class="action-buttons">
        <button class="btn-primary" @click="loadLeads" :disabled="store.loading">
          Filtrar
        </button>
        <button class="btn-outline" @click="showModal = true">
          Exportar
        </button>
      </div>
    </div>

    <p class="total">Total: {{ store.total }}</p>

    <div class="table-container" v-if="store.leads.length">
      <table>
        <thead>
          <tr>
            <th v-for="col in fixedColumns" :key="col">
              {{ col.replace(/_/g, ' ').toUpperCase() }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in store.leads" :key="lead._id">
            <td v-for="col in fixedColumns" :key="col">
              {{ lead[col] ?? 'NAN' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.loading" class="loading">Carregando leads...</div>
    <p v-if="store.error" class="error">{{ store.error }}</p>

    <ExportModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<style scoped>
.page {
  padding: 40px 32px;
  background: var(--bg-primary);
  min-height: 100vh;
}

h2 {
  font-size: 2.4rem;
  margin-bottom: 2rem;
  color: var(--accent);
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* Filtros - cards com mais espaço e hover */
.filters-bar {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px; /* mais espaço entre filtros */
  margin-bottom: 32px;
}

/* Botões maiores e mais destacados */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  color: #000;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 106, 0, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(255, 106, 0, 0.4);
}

.btn-primary:disabled {
  background: #664400;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--accent);
  color: var(--accent);
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: rgba(255, 106, 0, 0.15);
  transform: translateY(-3px);
}

/* Total destacado */
.total {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 32px;
  background: rgba(255, 106, 0, 0.08);
  padding: 12px 20px;
  border-radius: 12px;
  display: inline-block;
  border: 1px solid rgba(255, 106, 0, 0.2);
}

/* Tabela com contraste melhorado */
.table-container {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  max-height: calc(100vh - 340px);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #0d0d0d;
  color: var(--accent-light);
  padding: 18px 24px;
  text-align: left;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid var(--border);
  text-transform: uppercase;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

td {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.95rem;
}

tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.015);
}

tr:hover td {
  background: rgba(255, 106, 0, 0.08);
}

/* Loading e erro mais visíveis */
.loading, .empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
  font-size: 1.3rem;
  font-weight: 500;
}

.error {
  color: #ff5555;
  text-align: center;
  font-weight: 600;
  margin: 40px 0;
  font-size: 1.2rem;
}

/* Responsivo */
@media (max-width: 1024px) {
  .filter-group {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .page { padding: 24px 16px; }
  h2 { font-size: 1.9rem; }
  .filters-bar {
  display: grid;
  gap: 22px;
}
  .filter-group { gap: 20px; }
  .action-buttons { flex-direction: column; gap: 12px; }
  table { font-size: 13px; }
  th, td { padding: 14px 16px; }
}
</style>