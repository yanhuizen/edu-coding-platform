import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User } from '@/types/models';

const TOKEN_KEY = 'edu.auth.token';
const USER_KEY = 'edu.auth.user';

function safeParseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj && obj._id ? obj : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(safeParseUser(localStorage.getItem(USER_KEY)));
  const loading = ref(false);

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const role = computed(() => user.value?.role ?? null);
  const isTeacher = computed(() => role.value === 'teacher');
  const isStudent = computed(() => role.value === 'student');

  async function fetchMe() {
    if (!token.value) return null;
    try {
      loading.value = true;
      const r = await authApi.me();
      user.value = r.user;
      localStorage.setItem(USER_KEY, JSON.stringify(r.user));
      return r.user;
    } catch (e) {
      token.value = null;
      user.value = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function login(username: string, password: string) {
    const r = await authApi.login({ username, password });
    token.value = r.accessToken;
    user.value = r.user;
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    return r.user;
  }

  async function register(payload: {
    username: string;
    password: string;
    displayName: string;
    avatarEmoji?: string;
    inviteCode?: string;
  }) {
    const r = await authApi.register(payload);
    token.value = r.accessToken;
    user.value = r.user;
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    return r.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { token, user, loading, isLoggedIn, role, isTeacher, isStudent, fetchMe, login, register, logout };
});
