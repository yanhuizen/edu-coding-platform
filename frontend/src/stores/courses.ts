import { defineStore } from 'pinia';
import { ref } from 'vue';
import { coursesApi } from '@/api/courses';
import type { Course, Assignment } from '@/types/models';

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref<Course[]>([]);
  const loading = ref(false);

  async function loadAll() {
    loading.value = true;
    try {
      courses.value = await coursesApi.list();
    } finally {
      loading.value = false;
    }
  }

  async function loadOne(id: string): Promise<Course> {
    return coursesApi.get(id);
  }

  async function createCourse(payload: { title: string; description?: string; coverEmoji?: string }) {
    const c = await coursesApi.create(payload);
    courses.value.unshift(c);
    return c;
  }

  async function loadAssignments(courseId: string): Promise<Assignment[]> {
    return coursesApi.listAssignments(courseId);
  }

  return { courses, loading, loadAll, loadOne, createCourse, loadAssignments };
});
