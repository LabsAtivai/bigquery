<script setup lang="ts">
import { ref } from 'vue'
import { uploadImport, processImport } from '../api/imports'

const file = ref<File | null>(null)
const importId = ref<string>('')
const mappingJson = ref<string>('{\n  "email": "E-mail",\n  "nome_completo": "Nome completo",\n  "cargo": "Cargo"\n}')
const status = ref<string>('')

async function doUpload() {
  if (!file.value) return
  status.value = 'Enviando arquivo...'
  const fd = new FormData()
  fd.append('file', file.value)
  try {
    const { data } = await uploadImport(fd)
    importId.value = data.import_id || data._id || data
    status.value = `Upload concluído! ID: ${importId.value}`
  } catch (e: any) {
    status.value = 'Erro no upload. Verifique o endpoint /imports/upload.'
    console.error(e)
  }
}

async function doProcess() {
  if (!importId.value) return
  status.value = 'Processando...'
  try {
    const mapping = JSON.parse(mappingJson.value)
    const { data } = await processImport(importId.value, mapping)
    status.value = `Processamento concluído: ${JSON.stringify(data, null, 2)}`
  } catch (e: any) {
    status.value = 'Erro ao processar. Verifique o mapping JSON e o backend.'
    console.error(e)
  }
}
</script>

<template>
  <div class="page">
    <h2>Imports</h2>

    <div class="card">
      <p class="muted">Faça upload de CSV e processe via ETL. O mapping define como os campos do CSV viram colunas no banco.</p>

      <div class="grid">
        <label class="box">
          <span>Arquivo CSV</span>
          <input type="file" accept=".csv" @change="(e:any) => file = e.target.files?.[0] || null" />
          <button class="btn-primary" @click="doUpload">Upload</button>
        </label>

        <label class="box">
          <span>ID do Import (opcional)</span>
          <input v-model="importId" placeholder="Cole o ID se já existir" />
        </label>

        <label class="box full">
          <span>Mapping JSON</span>
          <textarea v-model="mappingJson" rows="10"></textarea>
          <button class="btn-primary" @click="doProcess">Processar</button>
        </label>
      </div>

      <div class="status" v-if="status">{{ status }}</div>
    </div>
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
  max-height: 70vh;
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
  .filters-bar { padding: 20px; }
  .filter-group { gap: 20px; }
  .action-buttons { flex-direction: column; gap: 12px; }
  table { font-size: 13px; }
  th, td { padding: 14px 16px; }
}
</style>