import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Tema global (fonte de verdade)
import './assets/base.css'

// (Opcional) se você tiver regras globais extras separadas
// import './assets/main.css'

// Mínimo global (não use o template do Vite aqui)
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')