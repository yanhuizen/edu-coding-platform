import { http } from './index';
import type { Assignment } from '@/types/models';

export const assignmentsApi = {
  get(id: string) {
    return http.get<{ assignment: Assignment }>(`/assignments/${id}`).then((r) => r.data.assignment);
  },
  create(payload: Omit<Assignment, '_id' | 'createdAt' | 'updatedAt'>) {
    return http.post<{ assignment: Assignment }>('/assignments', payload).then((r) => r.data.assignment);
  },
  update(id: string, payload: Partial<Assignment>) {
    return http.put<{ assignment: Assignment }>(`/assignments/${id}`, payload).then((r) => r.data.assignment);
  },
  remove(id: string) {
    return http.delete<{ ok: true }>(`/assignments/${id}`).then((r) => r.data);
  },
};
