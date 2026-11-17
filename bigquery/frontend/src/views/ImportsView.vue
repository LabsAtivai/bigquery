<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { uploadImport, processImport } from '../api/imports'

const file = ref<File | null>(null)
const importId = ref<string>('')
const mappingJson = ref<string>('{\n  "email": "E-mail",\n  "nome_completo": "Nome completo",\n  "cargo": "Cargo"\n}')
const status = ref<string>('')
const statusKind = ref<'info' | 'success' | 'error'>('info')
const uploading = ref(false)
const processing = ref(false)

async function doUpload() {
  if (!file.value || uploading.value) return
  uploading.value = true
  status.value = 'Enviando arquivo...'
  statusKind.value = 'info'
  const fd = new FormData()
  fd.append('file', file.value)
  try {
    const { data } = await uploadImport(fd)
    importId.value = data.import_id || data._id || data
    status.value = `Upload concluído! ID: ${importId.value}`
    statusKind.value = 'success'
  } catch (e: any) {
    status.value = 'Erro no upload. Verifique o endpoint /imports/upload.'
    statusKind.value = 'error'
    console.error(e)
  } finally {
    uploading.value = false
  }
}

async function doProcess() {
  if (!importId.value || processing.value) return
  processing.value = true
  status.value = 'Processando...'
  statusKind.value = 'info'
  try {
    const mapping = JSON.parse(mappingJson.value)
    const { data } = await processImport(importId.value, mapping)
    status.value = `Processamento concluído: ${JSON.stringify(data, null, 2)}`
    statusKind.value = 'success'
  } catch (e: any) {
    status.value = 'Erro ao processar. Verifique o mapping JSON e o backend.'
    statusKind.value = 'error'
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
      <p class="intro">
        Faça upload de CSV e processe via ETL. O mapping define como os campos do CSV viram colunas no banco.
      </p>

      <div class="steps">
        <section class="card step">
          <header class="step-head">
            <span class="step-num">1</span>
            <div>
              <h3>Arquivo CSV</h3>
              <p class="hint">Selecione o arquivo e envie para o servidor.</p>
            </div>
          </header>
          <div class="step-body">
            <input id="import-file" class="field" type="file" accept=".csv" :disabled="uploading" @change="(e:any) => file = e.target.files?.[0] || null" />
            <div class="step-actions">
              <button class="btn-primary" :disabled="!file || uploading" @click="doUpload">
                {{ uploading ? 'Enviando...' : 'Upload' }}
              </button>
            </div>
          </div>
        </section>

        <section class="card step">
          <header class="step-head">
            <span class="step-num">2</span>
            <div>
              <h3>ID do Import</h3>
              <p class="hint">Preenchido após o upload. Cole o ID se já existir.</p>
            </div>
          </header>
          <div class="step-body">
            <input id="import-id" class="field" v-model="importId" placeholder="Cole o ID se já existir" />
          </div>
        </section>

        <section class="card step step--wide">
          <header class="step-head">
            <span class="step-num">3</span>
            <div>
              <h3>Mapping JSON</h3>
              <p class="hint">Chave = campo no banco, valor = coluna do CSV.</p>
            </div>
          </header>
          <div class="step-body">
            <textarea id="import-mapping" class="field mono" v-model="mappingJson" rows="10" spellcheck="false"></textarea>
            <div class="step-actions">
              <button class="btn-primary" :disabled="!importId || processing" @click="doProcess">
                {{ processing ? 'Processando...' : 'Processar' }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="status" :class="`status--${statusKind}`" v-if="status" role="status" aria-live="polite">
        <span class="status-label">
          {{ statusKind === 'success' ? 'Sucesso' : statusKind === 'error' ? 'Erro' : 'Em andamento' }}
        </span>
        <pre class="status-text">{{ status }}</pre>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--accent);
  font-weight: 800;
  letter-spacing: -0.5px;
}

.intro {
  color: var(--text-muted);
  margin-bottom: 28px;
  max-width: 72ch;
  line-height: 1.5;
}

.steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.step {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.step--wide {
  grid-column: 1 / -1;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.step-num {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--accent);
  background: rgba(255, 106, 0, 0.12);
  border: 1px solid rgba(255, 106, 0, 0.4);
}

.step-head h3 {
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 700;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 2px;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.field {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.95rem;
}

.field:focus {
  outline: none;
  border-color: var(--accent);
}

input[type='file'].field {
  padding: 10px 12px;
  color: var(--text-secondary);
}

input[type='file']::file-selector-button {
  margin-right: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9rem;
  resize: vertical;
  line-height: 1.5;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.step-actions .btn-primary {
  padding: 12px 28px;
  font-size: 1rem;
}

.status {
  margin-top: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 106, 0, 0.25);
  background: rgba(255, 106, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status--success {
  border-color: rgba(70, 200, 120, 0.4);
  background: rgba(70, 200, 120, 0.08);
}

.status--error {
  border-color: rgba(255, 85, 85, 0.4);
  background: rgba(255, 85, 85, 0.1);
}

.status-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--accent);
}

.status--success .status-label { color: #5fd592; }
.status--error .status-label { color: #ff8f8f; }

.status-text {
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .steps { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 768px) {
  h2 { font-size: 1.6rem; }
  .card { padding: 20px; }
  .steps { gap: 16px; }
  .step-actions .btn-primary { width: 100%; }
}
</style>
