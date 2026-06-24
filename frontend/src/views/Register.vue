<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  username: '',
  password: '',
  password2: '',
  displayName: '',
  avatarEmoji: '🐼',
  inviteCode: '',
});

const error = ref('');
const loading = ref(false);

const isTeacherMode = ref(false);
const showInviteField = computed(() => isTeacherMode.value);

const avatars = ['🐼', '🐯', '🦊', '🐰', '🐨', '🐸', '🐵', '🦁', '🐶', '🐱', '🐧', '🐢'];

async function submit() {
  error.value = '';
  if (form.password !== form.password2) {
    error.value = '两次输入的密码不一致哦~';
    return;
  }
  loading.value = true;
  try {
    const payload: any = {
      username: form.username.trim(),
      password: form.password,
      displayName: form.displayName.trim() || form.username.trim(),
      avatarEmoji: form.avatarEmoji,
    };
    if (isTeacherMode.value && form.inviteCode) {
      payload.inviteCode = form.inviteCode.trim();
    }
    const u = await auth.register(payload);
    router.push(u.role === 'teacher' ? '/teacher/courses' : '/courses');
  } catch (e: any) {
    error.value = e?.message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-card card">
      <h1 class="title center">🎉 加入小象编程</h1>
      <p class="muted center mb-16">几秒钟就能开始学编程啦~</p>

      <div class="role-switch">
        <button :class="{ active: !isTeacherMode }" @click="isTeacherMode = false">🎒 我是学生</button>
        <button :class="{ active: isTeacherMode }" @click="isTeacherMode = true">👨‍🏫 我是老师</button>
      </div>

      <form class="col" @submit.prevent="submit">
        <label class="col">
          <span class="label">👤 用户名(3-24 位字母/数字/下划线)</span>
          <input v-model="form.username" class="input" required pattern="[a-z0-9_]{3,24}" />
        </label>
        <label class="col">
          <span class="label">😀 给自己选个头像</span>
          <div class="avatar-row">
            <button
              v-for="a in avatars"
              :key="a"
              type="button"
              class="avatar-btn"
              :class="{ active: form.avatarEmoji === a }"
              @click="form.avatarEmoji = a"
            >
              {{ a }}
            </button>
          </div>
        </label>
        <label class="col">
          <span class="label">📛 昵称(同学们看到的名字)</span>
          <input v-model="form.displayName" class="input" maxlength="24" />
        </label>
        <label class="col">
          <span class="label">🔒 密码(至少 6 位)</span>
          <input v-model="form.password" type="password" class="input" minlength="6" required />
        </label>
        <label class="col">
          <span class="label">🔒 再输入一次</span>
          <input v-model="form.password2" type="password" class="input" minlength="6" required />
        </label>
        <label v-if="showInviteField" class="col">
          <span class="label">🎫 教师邀请码</span>
          <input v-model="form.inviteCode" class="input" placeholder="如 DEMO2026" />
        </label>

        <div v-if="error" class="error-msg">⚠️ {{ error }}</div>

        <button class="btn" :disabled="loading">
          {{ loading ? '注册中...' : '🚀 注 册' }}
        </button>
      </form>

      <div class="footer">
        已经有账号了?
        <router-link to="/login">👉 去登录</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #FFFBE0 0%, #FFF8E1 50%, #E8F5E9 100%);
}

.register-card {
  width: 100%;
  max-width: 480px;
}

.role-switch {
  display: flex;
  background: #FFF3E0;
  padding: 4px;
  border-radius: $radius-pill;
  margin-bottom: 16px;
}

.role-switch button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: $radius-pill;
  font-weight: 600;
  color: $text-muted;
}

.role-switch button.active {
  background: $primary;
  color: white;
}

.label {
  font-weight: 600;
  color: $text-muted;
}

.avatar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.avatar-btn {
  width: 44px;
  height: 44px;
  font-size: 24px;
  border: 2px solid $border;
  background: white;
  border-radius: $radius;
  padding: 0;
}

.avatar-btn.active {
  border-color: $primary;
  background: $primary-light;
}

.center {
  text-align: center;
}

.mb-16 {
  margin-bottom: 16px;
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
