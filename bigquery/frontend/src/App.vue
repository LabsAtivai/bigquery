<template>
  <div class="layout">
    <aside class="sidebar">
      <h1>BigQuery Leads</h1>
      <nav>
        <router-link to="/leads" class="nav-link">Leads</router-link>
        <router-link to="/campaigns" class="nav-link">Campanhas</router-link>
      </nav>
    </aside>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #0e0e0e;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.sidebar {
  width: 240px;
  background: linear-gradient(to bottom, #111111, #0a0a0a);
  padding: 30px 20px;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.4);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  transition: width 0.3s ease;
}

.sidebar h1 {
  color: #ff6a00;
  font-size: 1.6rem;
  margin-bottom: 50px;
  text-align: center;
  letter-spacing: 1px;
}

.nav-link {
  display: block;
  color: #dddddd;
  text-decoration: none;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 12px;
  transition: background 0.3s, color 0.3s, transform 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 106, 0, 0.1);
  color: #ff6a00;
  transform: translateX(5px);
}

.nav-link.router-link-active {
  background: #ff6a00;
  color: #ffffff;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(255, 106, 0, 0.3);
}

main {
  flex: 1;
  padding: 50px 70px;
  margin-left: 240px;
  background: #0f0f0f;
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    padding: 20px;
    box-shadow: none;
  }

  main {
    margin-left: 0;
    padding: 30px 20px;
  }

  .nav-link {
    padding: 12px 16px;
  }
}
</style>