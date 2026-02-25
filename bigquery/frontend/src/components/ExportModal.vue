<script setup lang="ts">
import { reactive } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: {
    campaignName: string
    format: 'xlsx' | 'csv'
    downloadedBy: string
    clientName: string
    setorInformado: string
    user: string
  }): void
}>()

const form = reactive({
  campaignName: 'Export Leads',
  format: 'xlsx' as 'xlsx' | 'csv',
  downloadedBy: '',
  clientName: '',
  setorInformado: '',
  user: '',
})

function submit() {
  emit('submit', { ...form })
  emit('close')
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">Exportar Leads</div>
        <button class="icon" @click="emit('close')">✕</button>
      </div>

      <div class="grid">
        <label>
          <span>Nome da campanha</span>
          <input v-model="form.campaignName" placeholder="Ex: Adcont - Financeiro" />
        </label>

        <label>
          <span>Formato</span>
          <select v-model="form.format">
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </select>
        </label>

        <label>
          <span>Quem está baixando</span>
          <input v-model="form.downloadedBy" placeholder="Ex: Charles" />
        </label>

        <label>
          <span>Nome do cliente</span>
          <input v-model="form.clientName" placeholder="Ex: Adcont" />
        </label>

        <label class="full">
          <span>Setor informado (no momento do export)</span>
          <input v-model="form.setorInformado" placeholder="Ex: Financeiro" />
        </label>

        <label class="full">
          <span>User (opcional - salva no backend)</span>
          <input v-model="form.user" placeholder="Ex: charles@ativa.ai" />
        </label>
      </div>

      <div class="actions">
        <button class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" @click="submit">Exportar</button>
      </div>

      <div class="hint">
        Dica: ao exportar, eu salvo a campanha no backend com esses metadados.
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop{
  position:fixed; inset:0;
  background: rgba(0,0,0,.65);
  display:flex; align-items:center; justify-content:center;
  padding:16px; z-index:100;
}
.modal{
  width:min(720px, 100%);
  background:#0f0f0f;
  border:1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 25px 70px rgba(0,0,0,.6);
  padding:14px;
}
.modal-head{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom: 12px;
}
.modal-title{ font-weight: 800; color: var(--accent); font-size: 18px; }
.icon{
  background:#0b0b0b;
  border:1px solid var(--border);
  color: var(--text);
  border-radius: 12px;
  padding:8px 10px;
  cursor:pointer;
}
.grid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
label{ display:flex; flex-direction:column; gap:6px; }
label span{ color: var(--muted); font-size:12px; }
input, select{
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #0b0b0b;
  color: var(--text);
}
.full{ grid-column: 1 / -1; }

.actions{
  display:flex; justify-content:flex-end; gap:10px;
  margin-top: 14px;
}
.btn-ghost{
  padding:12px 16px;
  border-radius: 12px;
  border:1px solid var(--border);
  background:#0b0b0b;
  color: var(--text);
  cursor:pointer;
}
.btn-primary{
  padding:12px 16px;
  border-radius: 12px;
  border:none;
  background: linear-gradient(135deg, var(--accent), #ff8c3a);
  color:#0b0b0b;
  font-weight:900;
  cursor:pointer;
}
.hint{
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
}
</style>