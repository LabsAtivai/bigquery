<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Leads', path: '/leads' },
  { label: 'Campanhas', path: '/campaigns' },
  { label: 'Imports', path: '/imports' },
]

const active = computed(() => route.path)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="logo">BQ</div>
        <div class="brand-text">
          <div class="title">BigQuery Leads</div>
          <div class="subtitle">Gestão de Leads • Campanhas • Exports</div>
        </div>
      </div>

      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          class="tab"
          :class="{ active: active === tab.path }"
          @click="router.push(tab.path)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(17, 17, 17, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  color: #000;
  font-weight: 900;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text .title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent);
}

.brand-text .subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tab {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius);
  font-weight: 600;
  transition: var(--transition);
}

.tab:hover {
  background: var(--bg-card);
  border-color: var(--accent);
  color: var(--accent);
}

.tab.active {
  background: rgba(255, 106, 0, 0.15);
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.12);
}

.main-content {
  flex: 1;
  padding: 24px;
}
</style>