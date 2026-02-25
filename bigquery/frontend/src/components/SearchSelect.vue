<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Opt = { _id: string; count: number }

const props = defineProps<{
  modelValue?: string | string[]
  options?: Opt[]
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | string[]): void
}>()

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)

const safeModelValue = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue || ''
})

watch(
  () => props.modelValue,
  (v) => {
    query.value = Array.isArray(v) ? '' : (v as string) || ''
  }
)

const selectedLabels = computed(() => props.multiple ? safeModelValue.value : [])

const filtered = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  const base = props.options || []
  if (!q) return base.slice(0, 40)
  return base.filter(o => (o._id || '').toLowerCase().includes(q)).slice(0, 40)
})

function selectValue(v: string) {
  if (props.multiple) {
    const current = [...safeModelValue.value]
    const index = current.indexOf(v)
    if (index > -1) current.splice(index, 1)
    else current.push(v)
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

function onFocus() { open.value = true }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  if (e.key === 'Enter') {
    const exact = props.options?.find(o => (o._id || '').toLowerCase() === query.value.trim().toLowerCase())
    if (exact) selectValue(exact._id)
    else {
      emit('update:modelValue', query.value.trim())
      open.value = false
    }
  }
}

function handleClickOutside(ev: MouseEvent) {
  if (!root.value?.contains(ev.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="ss" ref="root">
    <div class="ss-input">
      <div v-if="props.multiple && selectedLabels.length" class="selected-badges">
        <span v-for="label in selectedLabels" :key="label" class="badge">
          {{ label }}
          <button class="badge-remove" @click="removeSelected(label)">×</button>
        </span>
      </div>

      <input
        :placeholder="placeholder || 'Digite para buscar...'"
        :disabled="disabled"
        :value="query"
        @input="(e: any) => { query = e.target.value; open = true }"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <button
        v-if="(modelValue || query) && !disabled"
        class="ss-clear"
        @click="clear"
        title="Limpar"
      >×</button>
    </div>

    <transition name="fade">
      <div v-if="open && !disabled" class="ss-pop">
        <div v-if="filtered.length === 0" class="ss-empty">Nenhuma opção encontrada</div>

        <button
          v-for="o in filtered"
          :key="o._id"
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
.ss { position: relative; width: 100%; }

.ss-input {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  min-height: 44px;
  transition: var(--transition);
}

.ss-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.12);
}

.selected-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-right: 8px;
}

.badge {
  background: rgba(255, 106, 0, 0.2);
  color: var(--accent);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.badge-remove {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
}

.ss-input input {
  flex: 1;
  min-width: 140px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  outline: none;
  padding: 6px 0;
  font-size: 15px;
}

.ss-clear {
  background: #242424;
  border: none;
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.ss-clear:hover { background: var(--accent); color: #000; }

.ss-pop {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  max-height: 340px;
  overflow-y: auto;
  z-index: 100;
}

.ss-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition);
}

.ss-item:hover { background: rgba(255, 106, 0, 0.08); }

.ss-selected {
  background: rgba(255, 106, 0, 0.15);
  font-weight: 600;
}

.ss-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ss-count {
  min-width: 48px;
  text-align: right;
  color: var(--accent);
  font-weight: 600;
  background: rgba(255, 106, 0, 0.12);
  padding: 4px 10px;
  border-radius: 12px;
}

.ss-empty {
  padding: 16px;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>