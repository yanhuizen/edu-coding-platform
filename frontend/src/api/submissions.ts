import { http } from './index';
import type { Submission } from '@/types/models';

export const submissionsApi = {
  submit(payload: { assignmentId: string; code: string; output: string }) {
    return http.post<{ submission: Submission }>('/submissions', payload).then((r) => r.data.submission);
  },
  mySubmissions() {
    return http.get<{ submissions: Submission[] }>('/submissions/mine').then((r) => r.data.submissions);
  },
  byAssignment(assignmentId: string) {
    return http
      .get<{ submissions: Submission[] }>(`/submissions/by-assignment/${assignmentId}`)
      .then((r) => r.data.submissions);
  },
  grade(id: string, payload: { score: number; comment?: string }) {
    return http
      .post<{ submission: Submission }>(`/submissions/${id}/grade`, payload)
      .then((r) => r.data.submission);
  },
};
