<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Opt = { _id: string; count: number }

const props = defineProps<{
  modelValue?: string | string[]          // opcional com default seguro
  options?: Opt[]                         // opcional com default []
  placeholder?: string                    // opcional com default
  disabled?: boolean
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | string[]): void
}>()

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)

// Garantimos que modelValue seja sempre array quando multiple=true
const safeModelValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return props.modelValue || ''
})

watch(
  () => props.modelValue,
  (v) => {
    query.value = Array.isArray(v) ? '' : (v as string) || ''
  }
)

const selectedLabels = computed(() => {
  return props.multiple ? safeModelValue.value : []
})

const filtered = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  const base = props.options || []
  if (!q) return base.slice(0, 40)
  return base
    .filter((o) => (o._id || '').toLowerCase().includes(q))
    .slice(0, 40)
})

function selectValue(v: string) {
  if (props.multiple) {
    const current = [...safeModelValue.value]
    const index = current.indexOf(v)
    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(v)
    }
    emit('update:modelValue', current)
    query.value = ''
  } else {
    emit('update:modelValue', v)
    query.value = v
    open.value = false
  }
}

function removeSelected(v: string) {
  if (props.multiple) {
    const current = [...safeModelValue.value]
    const index = current.indexOf(v)
    if (index > -1) {
      current.splice(index, 1)
      emit('update:modelValue', current)
    }
  }
}

function clear() {
  emit('update:modelValue', props.multiple ? [] : '')
  query.value = ''
  open.value = false
}

function onFocus() {
  open.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  if (e.key === 'Enter') {
    const exact = props.options?.find(
      (o) => (o._id || '').toLowerCase() === query.value.trim().toLowerCase()
    )
    if (exact) {
      selectValue(exact._id)
    } else {
      emit('update:modelValue', query.value.trim())
      open.value = false
    }
  }
}

function handleClickOutside(ev: MouseEvent) {
  if (!root.value?.contains(ev.target as Node)) open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="ss" ref="root">
    <div class="ss-input">
      <!-- Badges de itens selecionados (quando multiple) -->
      <div v-if="props.multiple && selectedLabels.length" class="selected-badges">
        <span v-for="label in selectedLabels" :key="label" class="badge">
          {{ label }}
          <button class="badge-remove" @click="removeSelected(label)">×</button>
        </span>
      </div>

      <!-- Input de busca -->
      <input
        :placeholder="placeholder || 'Digite para buscar...'"
        :disabled="disabled"
        :value="query"
        @input="(e: any) => { query = e.target.value; open = true }"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <!-- Botão limpar -->
      <button
        v-if="(modelValue || query) && !disabled"
        class="ss-clear"
        type="button"
        @click="clear"
        title="Limpar filtro"
      >
        ×
      </button>
    </div>

    <!-- Dropdown de opções -->
    <transition name="fade">
      <div v-if="open && !disabled" class="ss-pop">
        <div v-if="filtered.length === 0" class="ss-empty">
          Nenhuma opção encontrada
        </div>

        <button
          v-for="o in filtered"
          :key="o._id"
          type="button"
          class="ss-item"
          :class="{ 'ss-selected': props.multiple && safeModelValue.includes(o._id) }"
          @click="selectValue(o._id)"
        >
          <span class="ss-label">{{ o._id }}</span>
          <span class="ss-count">{{ o.count }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

.ss {
  position: relative;
  width: 100%;
}

.ss-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 12px 10px;
  transition: var(--transition);
}

.ss-input:focus-within {
  border-color: rgba(255, 106, 0, 0.6);
  box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.12);
}

.selected-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 106, 0, 0.25);
  background: rgba(255, 106, 0, 0.10);
  color: var(--text-primary);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
}

.badge-remove {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.badge-remove:hover {
  color: var(--accent);
}

.ss input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  padding-right: 34px; /* espaço pro X */
}

.ss input::placeholder {
  color: var(--text-muted);
}

.ss-clear {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.04);
  color: var(--text-primary);
  cursor: pointer;
}
.ss-clear:hover {
  border-color: rgba(255, 106, 0, 0.5);
}

.ss-pop {
  position: absolute;
  z-index: 50;
  width: 100%;
  margin-top: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}

.ss-empty {
  padding: 14px 14px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.ss-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
}

.ss-item:hover {
  background: rgba(255, 106, 0, 0.10);
}

.ss-selected {
  background: rgba(255, 106, 0, 0.14);
}

.ss-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ss-count {
  color: var(--text-muted);
  font-size: 0.85rem;
  border: 1px solid rgba(255,255,255,0.10);
  padding: 4px 8px;
  border-radius: 999px;
}

/* fade do dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}