<script setup lang="ts">
import { ref } from 'vue'
import { useLeadsStore } from '../stores/leads.store'

const emit = defineEmits(['close'])
const store = useLeadsStore()
const campaignName = ref('')
const format = ref<'csv' | 'xlsx'>('xlsx')

const exportNow = async () => {
  try {
    await store.exportLeads(store.filters, campaignName.value, format.value)
    emit('close')
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div class="modal" v-if="true">
      <div class="box">
        <h2>Nova Campanha</h2>
        <label for="campaignName">Nome da campanha</label>
        <input id="campaignName" v-model="campaignName" placeholder="Nome campanha" />
        <label for="format">Formato</label>
        <select id="format" v-model="format">
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </select>
        <button :disabled="store.exporting" @click="exportNow">
          {{ store.exporting ? 'Exportando...' : 'Exportar' }}
        </button>
        <button @click="$emit('close')">Cancelar</button>
        <p v-if="store.error" class="error">{{ store.error }}</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.box {
  background: #1a1a1a;
  padding: 30px;
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  text-align: left;
}

h2 {
  color: #ff6a00;
  margin-bottom: 20px;
}

label {
  display: block;
  color: #dddddd;
  margin-bottom: 5px;
  font-size: 14px;
}

input, select {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #333333;
  background: #141414;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s;
}

input:focus, select:focus {
  border-color: #ff6a00;
}

button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 10px;
  font-weight: bold;
}

button:first-of-type {
  background: #ff6a00;
  border: none;
  color: #ffffff;
}

button:first-of-type:hover {
  background: #ff8533;
}

button:first-of-type:disabled {
  background: #cc5500;
  cursor: not-allowed;
}

button:last-of-type {
  background: transparent;
  border: 1px solid #ff6a00;
  color: #ff6a00;
}

button:last-of-type:hover {
  background: #ff6a00;
  color: #ffffff;
}

.error {
  color: #ff0000;
  margin-top: 10px;
  text-align: center;
}

/* Animação modal */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .box {
    width: 90%;
    padding: 20px;
  }
}
</style>