<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
type Opt = { _id: string; count: number }
const props = defineProps<{
  modelValue: string | string[]
  options: Opt[]
  placeholder: string
  disabled?: boolean
  multiple?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string | string[]): void
}>()
const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)

watch(
  () => props.modelValue,
  (v) => {
    query.value = Array.isArray(v) ? v.join(', ') : v || ''
  }
)

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
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = current.indexOf(v)
    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(v)
    }
    emit('update:modelValue', current)
    query.value = current.join(', ')
  } else {
    emit('update:modelValue', v)
    query.value = v
  }
  open.value = false
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
    const exact = props.options.find(
      (o) => (o._id || '').toLowerCase() === query.value.trim().toLowerCase()
    )
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
      <input
        :placeholder="placeholder"
        :disabled="disabled"
        :value="query"
        @input="(e:any) => { query = e.target.value; open = true; emit('update:modelValue', props.multiple ? e.target.value.split(',').map(s => s.trim()) : e.target.value) }"
        @focus="onFocus"
        @keydown="onKeydown"
      />
      <button
        v-if="(modelValue || query) && !disabled"
        class="ss-clear"
        type="button"
        @click="clear"
        title="Limpar"
      >
        ×
      </button>
    </div>
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
          :class="{ 'ss-selected': props.multiple && (props.modelValue as string[]).includes(o._id) }"
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
}

.ss-input input {
  width: 100%;
  padding: 12px 36px 12px 16px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background: #141414;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ss-input input:focus {
  border-color: #ff6a00;
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.15);
}

.ss-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #242424;
  color: #ffffff;
  cursor: pointer;
  font-size: 16px;
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
  z-index: 50;
  width: 100%;
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid #2a2a2a;
  background: #101010;
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.ss-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.ss-item:hover {
  background: rgba(255, 106, 0, 0.1);
}

.ss-selected {
  background: rgba(255, 106, 0, 0.2);
  font-weight: bold;
}

.ss-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.ss-count {
  min-width: 44px;
  text-align: right;
  color: #ff6a00;
  font-weight: 700;
  background: rgba(255, 106, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.ss-empty {
  padding: 12px 16px;
  color: #aaaaaa;
  text-align: center;
}

/* Animação fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>