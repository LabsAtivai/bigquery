<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const tabs = [
  { label: 'Leads', path: '/leads' },
  { label: 'Campanhas', path: '/campaigns' },
  { label: 'Imports', path: '/imports' },
]

const active = computed(() => route.path)

// Titulo da aba do navegador acompanha a pagina atual
watchEffect(() => {
  const current = tabs.find((t) => t.path === active.value)
  document.title = current ? `${current.label} • BigQuery Leads` : 'BigQuery Leads'
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
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

      <nav class="tabs" aria-label="Navegação principal">
        <router-link
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="tab"
          :class="{ active: active === tab.path }"
          :aria-current="active === tab.path ? 'page' : undefined"
        >
          {{ tab.label }}
        </router-link>
      </nav>

      <div class="user-box">
        <span class="user-email" v-if="auth.user" :title="auth.user.email">{{ auth.user.email }}</span>
        <button class="logout-btn" type="button" aria-label="Sair" @click="handleLogout">
          Sair
        </button>
      </div>
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
  /* clip (e nao hidden) impede rolagem horizontal da pagina sem quebrar o position: sticky */
  overflow-x: clip;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(17, 17, 17, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px 20px;
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
  font-size: 0.95rem;
  text-decoration: none;
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
  min-width: 0; /* permite que filhos largos (tabelas) rolem dentro do proprio container */
  width: 100%;
  max-width: 1760px;
  margin: 0 auto;
  padding: 32px 32px 48px;
}

@media (max-width: 768px) {
  .topbar { padding: 12px 16px; }
  .brand-text .subtitle { display: none; }
  .logo { width: 40px; height: 40px; font-size: 1.3rem; }
  .brand-text .title { font-size: 1.15rem; }
  .tabs { order: 3; width: 100%; gap: 8px; }
  .tab { flex: 1; text-align: center; padding: 10px 8px; }
  .user-email { display: none; }
  .main-content { padding: 20px 16px 32px; }
}

.user-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-email {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.85rem;
  transition: var(--transition);
}

.logout-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>