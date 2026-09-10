<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { uploadImport, processImport } from '../api/imports'

const file = ref<File | null>(null)
const importId = ref<string>('')
const mappingJson = ref<string>('{\n  "email": "E-mail",\n  "nome_completo": "Nome completo",\n  "cargo": "Cargo"\n}')
const status = ref<string>('')
const uploading = ref(false)
const processing = ref(false)

async function doUpload() {
  if (!file.value || uploading.value) return
  uploading.value = true
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
  } finally {
    uploading.value = false
  }
}

async function doProcess() {
  if (!importId.value || processing.value) return
  processing.value = true
  status.value = 'Processando...'
  try {
    const mapping = JSON.parse(mappingJson.value)
    const { data } = await processImport(importId.value, mapping)
    status.value = `Processamento concluído: ${JSON.stringify(data, null, 2)}`
  } catch (e: any) {
    status.value = 'Erro ao processar. Verifique o mapping JSON e o backend.'
    console.error(e)
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="page">
      <h2>Imports</h2>

      <div class="card">
        <p class="muted">Faça upload de CSV e processe via ETL. O mapping define como os campos do CSV viram colunas no banco.</p>

        <div class="grid">
          <label class="box">
            <span>Arquivo CSV</span>
            <input type="file" accept=".csv" :disabled="uploading" @change="(e:any) => file = e.target.files?.[0] || null" />
            <button class="btn-primary" :disabled="!file || uploading" @click="doUpload">
              {{ uploading ? 'Enviando...' : 'Upload' }}
            </button>
          </label>

          <label class="box">
            <span>ID do Import (opcional)</span>
            <input v-model="importId" placeholder="Cole o ID se já existir" />
          </label>

          <label class="box full">
            <span>Mapping JSON</span>
            <textarea v-model="mappingJson" rows="10"></textarea>
            <button class="btn-primary" :disabled="!importId || processing" @click="doProcess">
              {{ processing ? 'Processando...' : 'Processar' }}
            </button>
          </label>
        </div>

        <div class="status" v-if="status">{{ status }}</div>
      </div>
    </div>
  </AppShell>
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

.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.muted {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box.full {
  grid-column: 1 / -1;
}

.box span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.box input,
.box textarea {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.95rem;
}

.box input:focus,
.box textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.box textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  resize: vertical;
}

.box .btn-primary {
  align-self: flex-start;
}

.status {
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 106, 0, 0.08);
  border: 1px solid rgba(255, 106, 0, 0.2);
  color: var(--text-primary);
  white-space: pre-wrap;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .page { padding: 24px 16px; }
  h2 { font-size: 1.9rem; }
  .card { padding: 20px; }
  .grid { gap: 16px; }
}
</style>
