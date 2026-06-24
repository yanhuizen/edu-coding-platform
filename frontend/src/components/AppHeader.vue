<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-emoji">🐘</span>
        <span class="logo-text">小象编程</span>
      </router-link>

      <nav v-if="auth.isLoggedIn" class="nav">
        <router-link v-if="auth.isStudent" to="/courses" :class="{ active: route.path.startsWith('/courses') && !route.path.startsWith('/teacher') }">📚 课程</router-link>
        <router-link v-if="auth.isTeacher" to="/teacher/dashboard" :class="{ active: route.path === '/teacher/dashboard' }">📊 大屏</router-link>
        <router-link v-if="auth.isTeacher" to="/teacher/courses" :class="{ active: route.path.startsWith('/teacher/courses') }">👨‍🏫 后台</router-link>
        <router-link to="/profile" :class="{ active: route.path === '/profile' }">👤 我的</router-link>
      </nav>

      <div v-if="auth.isLoggedIn" class="user-area">
        <span class="avatar">{{ auth.user?.avatarEmoji }}</span>
        <span class="name">{{ auth.user?.displayName }}</span>
        <button class="btn btn-ghost btn-sm" @click="logout">退出</button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-header {
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 700;
  font-size: 22px;
  text-decoration: none;
}

.logo-emoji {
  font-size: 28px;
}

.nav {
  display: flex;
  gap: 16px;
  flex: 1;
  margin-left: 16px;
}

.nav a {
  color: white;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: $radius-pill;
  transition: background 0.2s;
}

.nav a:hover {
  background: rgba(255, 255, 255, 0.18);
  text-decoration: none;
}

.nav a.active {
  background: rgba(255, 255, 255, 0.28);
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.avatar {
  font-size: 28px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.btn-sm:hover {
  background: rgba(255, 255, 255, 0.32);
  color: white;
}
</style>
