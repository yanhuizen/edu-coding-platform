<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppHeader from '@/components/AppHeader.vue';
import AIAssistant from '@/components/AIAssistant.vue';

const auth = useAuthStore();

onMounted(() => {
  if (auth.token && !auth.user) {
    auth.fetchMe();
  }
});
</script>

<template>
  <div class="app-root">
    <AppHeader v-if="auth.isLoggedIn" />
    <main class="app-main">
      <router-view />
    </main>
    <AIAssistant />
  </div>
</template>

<style lang="scss">
@use '@/styles/common.scss';

.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 720px) {
  .app-main {
    padding: 16px;
  }
}
</style>
