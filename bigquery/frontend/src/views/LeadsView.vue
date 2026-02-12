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
  '_id',
  'email',
  'nome_completo',
  'cargo',
  'empresa',
  'setor_empresa',
  'tamanho',
  'cidade_empresa',
  'estado_empresa',
  'pais_empresa',
  'telefone_sede',
  'updated_at',
  'import_id'
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

// Watch para debug: toda vez que filters mudar, loga
watch(filters, (newFilters) => {
  console.log('[DEBUG] Filtros alterados pelo usuário:', newFilters)
}, { deep: true })

async function loadFilters() {
  filtersLoading.value = true
  try {
    console.log('[DEBUG] Iniciando loadFilters com params iniciais:', filters)
    const { data } = await getFilters(filters)
    console.log('[DEBUG] Filtros recebidos do backend:', data)
    filterOptions.value = data || {}
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar filtros:', err)
    store.error = 'Erro ao carregar opções de filtro. Verifique o console e o backend.'
  } finally {
    filtersLoading.value = false
  }
}

async function loadLeads() {
  console.log('[DEBUG] Botão Filtrar clicado! Enviando filtros para o store:', JSON.stringify(filters, null, 2))
  try {
    await store.fetchLeads(filters)
    console.log('[DEBUG] Leads atualizados no store. Total atual:', store.total)
    console.log('[DEBUG] Primeiros 3 leads:', store.leads.slice(0, 3))
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar leads:', err)
    store.error = 'Erro ao filtrar leads. Veja o console para detalhes.'
  }
}

onMounted(async () => {
  console.log('[DEBUG] LeadsView montado. Iniciando carregamento inicial...')
  await loadFilters()
  await loadLeads()
})
</script>

<m   

<template>
  <div class="page">
    <h2>Leads</h2>

    <!-- ================= FILTERS ================= -->
    <div class="filters-bar">
      <div v-if="filtersLoading" class="loading">Carregando filtros...</div>
      <div v-else-if="Object.keys(filterOptions).length === 0" class="empty">
        Nenhuma opção de filtro disponível no momento.
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

    <!-- ================= SUMMARY ================= -->
    <p class="total">
      Total: {{ store.total }}
    </p>

    <!-- ================= TABLE ================= -->
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

    <div v-if="store.loading" class="loading">
      Carregando leads...
    </div>
    <p v-if="store.error" class="error">
      {{ store.error }}
    </p>

    <ExportModal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<style scoped>
.page {
  padding: 30px;
  background: #0f0f0f;
  color: #ffffff;
  min-height: 100vh;
}

/* ================= FILTERS ================= */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-primary {
  background: linear-gradient(90deg, #ff6a00, #ff8533);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 106, 0, 0.35);
}

.btn-primary:disabled {
  background: #cc5500;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ff6a00;
  color: #ff6a00;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: #ff6a00;
  color: white;
}

/* ================= TABLE ================= */
.table-container {
  background: #161616;
  padding: 20px;
  border-radius: 16px;
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  color: #ff6a00;
  padding: 14px 16px;
  border-bottom: 2px solid #222;
  position: sticky;
  top: 0;
  background: #111;
  text-transform: capitalize;
  font-weight: 600;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #222;
  color: #ddd;
}

tr:hover td {
  background: #1f1f1f;
}

.total {
  margin-bottom: 15px;
  font-weight: 500;
  font-size: 1.1rem;
}

/* ================= STATES ================= */
.loading {
  text-align: center;
  color: #ff6a00;
  font-size: 1.2rem;
  margin: 20px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.error {
  color: #ff4444;
  text-align: center;
  font-weight: bold;
  margin-top: 15px;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .filter-group {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  table {
    font-size: 13px;
  }
}
</style>