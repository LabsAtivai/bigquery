<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import AppShell from '../components/AppShell.vue'
import { useLeadsStore } from '../stores/leads.store'
import { getFilters, exportLeads, searchFilterField, updateLead, deleteLead } from '../api/leads'
import SearchSelect from '../components/SearchSelect.vue'
import ExportModal from '../components/ExportModal.vue'
import EditLeadModal from '../components/EditLeadModal.vue'

const store = useLeadsStore()
const showModal = ref(false)
const filtersLoading = ref(true)
const editingLead = ref<Record<string, any> | null>(null)

/**
 * ✅ Tipos para evitar TS7053 quando usar item.key
 */
type FilterKey =
  | 'setor_empresa'
  | 'estado_empresa'
  | 'cidade_empresa'
  | 'pais_empresa'
  | 'tamanho'
  | 'cargo'
  | 'client'

type FilterOptionsKey =
  | 'setores'
  | 'estados'
  | 'cidades'
  | 'paises'
  | 'tamanhos'
  | 'cargos'
  | 'clientes'

const filterOrder: Array<{ key: FilterKey; label: string; optionsKey: FilterOptionsKey; remoteSearch?: boolean }> = [
  { key: 'setor_empresa', label: 'Setor', optionsKey: 'setores' },
  { key: 'estado_empresa', label: 'Estado', optionsKey: 'estados' },
  { key: 'cidade_empresa', label: 'Cidade', optionsKey: 'cidades' },
  { key: 'pais_empresa', label: 'País', optionsKey: 'paises' },
  { key: 'tamanho', label: 'Porte', optionsKey: 'tamanhos' },
  { key: 'cargo', label: 'Cargo', optionsKey: 'cargos', remoteSearch: true },
  { key: 'client', label: 'Cliente', optionsKey: 'clientes' },
]

/**
 * ✅ cargo tem cauda longa de variações (texto livre); busca no backend
 * em vez de depender só do top-200 pré-carregado
 */
async function searchCargo(term: string) {
  try {
    const { data } = await searchFilterField('cargo', term, filters)
    return data || []
  } catch (err) {
    console.error('Erro ao buscar cargos:', err)
    return []
  }
}

const fixedColumns = [
  'email','nome','nome_completo','linkedin','cargo',
  'pais','localizacao','empresa','url_empresa','tamanho',
  'pais_empresa','localizacao_empresa','estado_empresa','cidade_empresa','setor_empresa'
] as const

/**
 * ✅ filtros tipados
 */
const filters = reactive<Record<FilterKey, string[]>>({
  setor_empresa: [],
  estado_empresa: [],
  cidade_empresa: [],
  pais_empresa: [],
  tamanho: [],
  cargo: [],
  client: [],
})

/**
 * ✅ options tipadas (cada opção vem como { _id, count } no backend)
 */
type AggItem = { _id: string; count: number }

const filterOptions = ref<Record<FilterOptionsKey, AggItem[]>>({
  setores: [],
  estados: [],
  cidades: [],
  paises: [],
  tamanhos: [],
  cargos: [],
  clientes: [],
})

/**
 * ✅ payload do ExportModal (ele emite submit com esse shape)
 */
type ExportMeta = {
  campaignName: string
  format: 'xlsx' | 'csv'
  downloadedBy: string
  clientName: string
  setorInformado: string
  user?: string
}

async function handleExport(meta: ExportMeta) {
  const result = await exportLeads({
    ...filters,
    ...meta,
  })

  if (result.ok) {
    showModal.value = false
    store.clearExportError()
    return
  }

  store.setExportError(result.message || 'Falha ao exportar')
}
async function loadFilters() {
  filtersLoading.value = true
  try {
    const { data } = await getFilters(filters)
    filterOptions.value = {
      setores: data?.setores ?? [],
      estados: data?.estados ?? [],
      cidades: data?.cidades ?? [],
      paises: data?.paises ?? [],
      tamanhos: data?.tamanhos ?? [],
      cargos: data?.cargos ?? [],
      clientes: data?.clientes ?? [],
    }
  } catch (err) {
    console.error('Erro ao carregar filtros:', err)
    store.setError('Erro ao carregar opções de filtro.')
  } finally {
    filtersLoading.value = false
  }
}

async function loadLeads() {
  await store.applyFilters(filters)
}

const pageSizeOptions = [25, 50, 100, 200] as const

async function handleLimitChange(e: Event) {
  const value = Number((e.target as HTMLSelectElement).value)
  await store.setLimit(value, filters)
}

async function clearFilters() {
  filterOrder.forEach((item) => {
    filters[item.key] = []
  })
  await loadLeads()
}

const isInitialLoading = computed(() => store.loading && store.leads.length === 0)
const isRefetching = computed(() => store.loading && store.leads.length > 0)
const showEmptyState = computed(
  () => !store.loading && store.leads.length === 0 && !store.error,
)

const resultRange = computed(() => {
  if (!store.total) return null
  const from = (store.page - 1) * store.limit + 1
  const to = Math.min(store.page * store.limit, store.total)
  return { from, to }
})

const pageInput = ref('')

function submitPageJump() {
  const target = Number(pageInput.value)
  if (!Number.isInteger(target) || target < 1 || target > store.totalPages) return
  store.goToPage(target, filters)
  pageInput.value = ''
}

async function handleEditSave(data: Record<string, string>) {
  if (!editingLead.value) return
  try {
    await updateLead(editingLead.value._id, data)
    editingLead.value = null
    await store.fetchLeads(filters)
  } catch (err: any) {
    store.setError(err?.response?.data?.message || 'Erro ao salvar lead.')
  }
}

async function handleDeleteLead(id: string, label: string) {
  if (!confirm(`Excluir o lead "${label}"? Essa ação não pode ser desfeita.`)) return
  try {
    await deleteLead(id)
    await store.fetchLeads(filters)
  } catch (err: any) {
    store.setError(err?.response?.data?.message || 'Erro ao excluir lead.')
  }
}

onMounted(() => {
  // Filtros e leads não dependem um do outro no boot — buscar em paralelo
  // reduz o tempo até a tabela aparecer pela primeira vez.
  loadFilters()
  loadLeads()
})
</script>

<template>
  <AppShell>
    <div class="page">
      <h2>Leads</h2>
      <div class="filters-bar">
        <div v-if="filtersLoading" class="filter-group" aria-hidden="true">
          <span v-for="item in filterOrder" :key="item.key" class="skeleton-bar skeleton-bar--field" />
        </div>
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
            :on-search="item.remoteSearch ? searchCargo : undefined"
            multiple
          />
        </div>
        <div class="action-buttons">
          <button
            class="btn-primary"
            @click="loadLeads"
            :disabled="store.loading"
          >
            <span v-if="isRefetching" class="spinner" aria-hidden="true" />
            {{ isRefetching ? 'Filtrando…' : 'Filtrar' }}
          </button>
          <button
            class="btn-outline"
            @click="showModal = true"
          >
            Exportar
          </button>
        </div>
        <p v-if="store.exportError" class="error export-error">
          {{ store.exportError }}
        </p>
      </div>

      <p v-if="store.error" class="alert alert-error">
        <svg class="alert-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5" />
          <path d="M10 6v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" />
        </svg>
        {{ store.error }}
      </p>

      <div class="results-bar">
        <p class="results-count">
          <template v-if="resultRange">
            Mostrando <strong>{{ resultRange.from }}–{{ resultRange.to }}</strong> de <strong>{{ store.total }}</strong> leads
          </template>
          <template v-else-if="store.error">
            Não foi possível carregar os leads
          </template>
          <template v-else-if="!isInitialLoading">
            Nenhum lead encontrado
          </template>
          <template v-else>
            Carregando leads…
          </template>
        </p>
        <label class="page-size">
          Por página
          <select :value="store.limit" :disabled="store.loading" @change="handleLimitChange">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
      </div>

      <div class="table-container" v-if="store.leads.length || isInitialLoading">
        <div v-if="isRefetching" class="refresh-badge">
          <span class="spinner" aria-hidden="true" />
          Atualizando
        </div>
        <table :class="{ 'is-refreshing': isRefetching }">
          <thead>
            <tr>
              <th v-for="col in fixedColumns" :key="col">
                {{ col.replace(/_/g,' ').toUpperCase() }}
              </th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody v-if="isInitialLoading">
            <tr v-for="n in 10" :key="`skeleton-${n}`" class="skeleton-row" aria-hidden="true">
              <td v-for="col in fixedColumns" :key="col"><span class="skeleton-bar" /></td>
              <td><span class="skeleton-bar skeleton-bar--sm" /></td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="lead in store.leads" :key="lead._id">
              <td v-for="col in fixedColumns" :key="col">
                {{ lead[col] ?? '—' }}
              </td>
              <td class="row-actions">
                <button class="btn-icon" aria-label="Editar lead" @click="editingLead = lead">
                  Editar
                </button>
                <button
                  class="btn-icon btn-danger"
                  aria-label="Excluir lead"
                  @click="handleDeleteLead(lead._id, lead.nome || lead.email)"
                >
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="showEmptyState" class="state-panel">
        <svg class="state-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="8" y="14" width="32" height="24" rx="3" stroke="currentColor" stroke-width="1.6" />
          <path d="M8 22h9.5c.8 0 1.5.5 1.8 1.3l1 2.4c.3.8 1 1.3 1.8 1.3h3.8c.8 0 1.5-.5 1.8-1.3l1-2.4c.3-.8 1-1.3 1.8-1.3H40" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M16 14v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="currentColor" stroke-width="1.6" />
        </svg>
        <p class="state-title">Nenhum lead encontrado</p>
        <p class="state-hint">Ajuste ou limpe os filtros aplicados e tente novamente.</p>
        <button class="btn-outline" @click="clearFilters">Limpar filtros</button>
      </div>

      <div class="pagination" v-if="store.totalPages > 1">
        <button
          class="btn-outline"
          :disabled="store.page <= 1 || store.loading"
          aria-label="Página anterior"
          @click="store.goToPage(store.page - 1, filters)"
        >
          ← Anterior
        </button>
        <span class="page-indicator">
          Página {{ store.page }} de {{ store.totalPages }}
        </span>
        <button
          class="btn-outline"
          :disabled="store.page >= store.totalPages || store.loading"
          aria-label="Próxima página"
          @click="store.goToPage(store.page + 1, filters)"
        >
          Próxima →
        </button>
        <form class="page-jump" @submit.prevent="submitPageJump">
          <label for="page-jump-input">Ir para</label>
          <input
            id="page-jump-input"
            v-model="pageInput"
            type="number"
            min="1"
            :max="store.totalPages"
            :disabled="store.loading"
            placeholder="Nº"
          />
        </form>
      </div>
      <ExportModal
        v-if="showModal"
        @close="showModal = false"
        @export="handleExport"
      />
      <EditLeadModal
        v-if="editingLead"
        :lead="editingLead"
        @close="editingLead = null"
        @save="handleEditSave"
      />
    </div>
  </AppShell>
</template>

<style scoped>
/* SEUS STYLES MANTIDOS */
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
  gap: 32px;
  margin-bottom: 32px;
}

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

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.alert-error {
  background: rgba(255, 85, 85, 0.1);
  border: 1px solid rgba(255, 85, 85, 0.35);
  color: #ff8f8f;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.results-count {
  font-size: 1rem;
  color: var(--text-secondary);
}

.results-count strong {
  color: var(--text-primary);
  font-weight: 700;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
}

.page-size select {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.page-size select:hover {
  border-color: var(--border-hover);
}

.page-size select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: var(--accent);
  animation: spin 0.7s linear infinite;
  vertical-align: -2px;
  margin-right: 6px;
}

.btn-primary .spinner {
  border-color: rgba(0, 0, 0, 0.25);
  border-top-color: #000;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-container {
  position: relative;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: auto;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  max-height: calc(100vh - 340px);
}

.refresh-badge {
  position: absolute;
  top: 14px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10, 10, 10, 0.88);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 999px;
  z-index: 20;
  backdrop-filter: blur(6px);
}

table {
  width: 100%;
  border-collapse: collapse;
}

table.is-refreshing tbody {
  opacity: 0.45;
  transition: opacity 0.2s ease;
}

.skeleton-row {
  pointer-events: none;
}

.skeleton-bar {
  display: block;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.13) 50%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeleton-bar--sm {
  width: 60%;
}

.skeleton-bar--field {
  height: 52px;
  border-radius: var(--radius);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.state-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 64px 32px;
  text-align: center;
}

.state-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 20px;
  color: var(--text-muted);
}

.state-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.state-hint {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.state-panel .btn-outline {
  padding: 10px 24px;
  font-size: 0.95rem;
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

.empty {
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

.row-actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-icon:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-icon.btn-danger:hover {
  border-color: #ff5555;
  color: #ff5555;
}

.export-error {
  margin: 16px 0 0;
  font-size: 0.95rem;
  text-align: right;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  margin: 24px 0;
}

.pagination .btn-outline {
  padding: 10px 20px;
  font-size: 0.95rem;
}

.pagination .btn-outline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.page-indicator {
  color: var(--text-secondary);
  font-weight: 600;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 20px;
  border-left: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
}

.page-jump input {
  width: 68px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  -moz-appearance: textfield;
}

.page-jump input::-webkit-inner-spin-button,
.page-jump input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-color: var(--accent);
}

@media (max-width: 1024px) {
  .filter-group {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .page { padding: 24px 16px; }
  h2 { font-size: 1.9rem; }
  .filters-bar { display: grid; gap: 22px; }
  .filter-group { gap: 20px; }
  .action-buttons { flex-direction: column; gap: 12px; }
  table { font-size: 13px; }
  th, td { padding: 14px 16px; }
  .results-bar { flex-direction: column; align-items: flex-start; }
  .pagination { gap: 12px; }
  .page-jump { margin-left: 0; padding-left: 0; border-left: none; }
}
</style>
