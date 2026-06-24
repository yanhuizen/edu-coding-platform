import { http } from './index';
import type { Course, Lesson, Assignment } from '@/types/models';

export const coursesApi = {
  list() {
    return http.get<{ courses: Course[] }>('/courses').then((r) => r.data.courses);
  },
  get(id: string) {
    return http.get<{ course: Course }>(`/courses/${id}`).then((r) => r.data.course);
  },
  create(payload: { title: string; description?: string; coverEmoji?: string }) {
    return http.post<{ course: Course }>('/courses', payload).then((r) => r.data.course);
  },
  update(id: string, payload: Partial<Course>) {
    return http.put<{ course: Course }>(`/courses/${id}`, payload).then((r) => r.data.course);
  },
  addLesson(id: string, payload: { title: string; contentMd?: string; codeExample?: string; order?: number }) {
    return http
      .post<{ course: Course }>(`/courses/${id}/lessons`, {
        title: payload.title,
        contentMd: payload.contentMd ?? '',
        codeExample: payload.codeExample ?? '',
        order: payload.order ?? 0,
      })
      .then((r) => r.data.course);
  },
  updateLesson(id: string, lessonId: string, payload: Partial<Lesson>) {
    return http
      .put<{ course: Course }>(`/courses/${id}/lessons/${lessonId}`, payload)
      .then((r) => r.data.course);
  },
  deleteLesson(id: string, lessonId: string) {
    return http
      .delete<{ course: Course }>(`/courses/${id}/lessons/${lessonId}`)
      .then((r) => r.data.course);
  },
  listAssignments(id: string) {
    return http
      .get<{ assignments: Assignment[] }>(`/courses/${id}/assignments`)
      .then((r) => r.data.assignments);
  },
};
