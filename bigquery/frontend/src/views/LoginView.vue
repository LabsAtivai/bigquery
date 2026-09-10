<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = useAuthStore()

async function handleSubmit() {
  const ok = await auth.login(email.value.trim(), password.value)
  if (ok) {
    const redirect = (router.currentRoute.value.query.redirect as string) || '/leads'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleSubmit">
      <div class="logo">BQ</div>
      <h1>BigQuery Leads</h1>
      <p class="subtitle">Entre com suas credenciais</p>

      <label class="field">
        <span>E-mail</span>
        <input v-model="email" type="email" autocomplete="username" required />
      </label>

      <label class="field">
        <span>Senha</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="auth.error" class="error" role="alert">{{ auth.error }}</p>

      <button class="btn-primary" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  color: #000;
  font-weight: 900;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 1.4rem;
  color: var(--accent);
  font-weight: 800;
  margin: 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: -8px 0 8px;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.field input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
}

.field input:focus {
  outline: none;
  border-color: var(--accent);
}

.error {
  color: #ff5555;
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  border: none;
  padding: 14px;
  border-radius: 12px;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(255, 106, 0, 0.35);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
