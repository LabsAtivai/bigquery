<script setup lang="ts">
import { reactive } from 'vue'

const EDITABLE_FIELDS = [
  'email', 'nome', 'nome_completo', 'linkedin', 'cargo',
  'pais', 'localizacao', 'empresa', 'url_empresa', 'tamanho',
  'pais_empresa', 'localizacao_empresa', 'estado_empresa', 'cidade_empresa',
  'setor_empresa', 'client',
] as const

const props = defineProps<{ lead: Record<string, any> }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Record<string, string>): void
}>()

const form = reactive<Record<string, string>>(
  Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, props.lead?.[f] ?? ''])),
)

function handleSubmit() {
  emit('save', { ...form })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">Editar Lead</div>
        <button class="icon" aria-label="Fechar" @click="emit('close')">✕</button>
      </div>

      <div class="grid">
        <label v-for="field in EDITABLE_FIELDS" :key="field">
          <span>{{ field.replace(/_/g, ' ') }}</span>
          <input v-model="form[field]" />
        </label>
      </div>

      <div class="actions">
        <button class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" @click="handleSubmit">Salvar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
}

.modal {
  width: min(880px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: #0f0f0f;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, .6);
  padding: 14px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-title {
  font-weight: 800;
  color: var(--accent);
  font-size: 18px;
}

.icon {
  background: #0b0b0b;
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label span {
  color: var(--text-muted);
  font-size: 12px;
  text-transform: capitalize;
}

input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #0b0b0b;
  color: var(--text-primary);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn-ghost {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #0b0b0b;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-primary {
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #ff8c3a);
  color: #0b0b0b;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 720px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
