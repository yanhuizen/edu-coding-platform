import { http } from './index';
import type { AuthResponse, User } from '@/types/models';

export const authApi = {
  register(payload: {
    username: string;
    password: string;
    displayName: string;
    avatarEmoji?: string;
    inviteCode?: string;
  }) {
    return http.post<AuthResponse>('/auth/register', payload).then((r) => r.data);
  },
  login(payload: { username: string; password: string }) {
    return http.post<AuthResponse>('/auth/login', payload).then((r) => r.data);
  },
  me() {
    return http.get<{ user: User }>('/auth/me').then((r) => r.data);
  },
};
