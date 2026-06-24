<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  username: '',
  password: '',
});

const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    const u = await auth.login(form.username.trim(), form.password);
    const next = (route.query.next as string) || (u.role === 'teacher' ? '/teacher/courses' : '/courses');
    router.push(next);
  } catch (e: any) {
    error.value = e?.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="title center">🐘 欢迎来到小象编程</h1>
      <p class="muted center mb-24">学 Python,从这里开始~</p>

      <form class="col" @submit.prevent="submit">
        <label class="col">
          <span class="label">👤 用户名</span>
          <input v-model="form.username" class="input" autocomplete="username" required />
        </label>
        <label class="col">
          <span class="label">🔒 密码</span>
          <input v-model="form.password" type="password" class="input" autocomplete="current-password" required />
        </label>

        <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

        <button class="btn" :disabled="loading">
          {{ loading ? '登录中...' : '🚀 登 录' }}
        </button>
      </form>

      <div class="footer">
        还没有账号?
        <router-link to="/register">👉 立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #FFFBE0 0%, #FFF8E1 50%, #E8F5E9 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.label {
  font-weight: 600;
  color: $text-muted;
}

.center {
  text-align: center;
}

.mb-24 {
  margin-bottom: 24px;
}

.error-msg {
  background: #FFEBEE;
  color: #B71C1C;
  padding: 10px 14px;
  border-radius: $radius;
  font-weight: 600;
}

.footer {
  margin-top: 20px;
  text-align: center;
  color: $text-muted;
}
</style>
