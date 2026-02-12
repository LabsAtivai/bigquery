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

<style scoped>
.ss {
  position: relative;
  width: 100%;
}

.ss-input {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background: #141414;
  min-height: 42px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ss-input:focus-within {
  border-color: #ff6a00;
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.15);
}

.selected-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-right: 8px;
}

.badge {
  background: #ff6a00;
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-remove {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ss-input input {
  flex: 1;
  min-width: 120px;
  background: transparent;
  border: none;
  color: white;
  outline: none;
  padding: 4px 0;
  font-size: 14px;
}

.ss-clear {
  background: #242424;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.ss-clear:hover {
  background: #ff6a00;
}

.ss-pop {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: #101010;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  max-height: 320px;
  overflow-y: auto;
  z-index: 100;
}

.ss-item {
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: white;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}

.ss-item:hover {
  background: rgba(255, 106, 0, 0.12);
}

.ss-selected {
  background: rgba(255, 106, 0, 0.25);
  font-weight: 500;
}

.ss-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ss-count {
  min-width: 40px;
  text-align: right;
  color: #ff6a00;
  font-weight: bold;
  background: rgba(255, 106, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.ss-empty {
  padding: 12px 16px;
  color: #888;
  text-align: center;
  font-style: italic;
}

/* Transição suave do dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>