import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => (useAuthStore().isTeacher ? '/teacher/courses' : '/courses') },
    { path: '/login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
    { path: '/register', component: () => import('@/views/Register.vue'), meta: { guest: true } },
    { path: '/courses', component: () => import('@/views/Courses.vue'), meta: { auth: true } },
    { path: '/courses/:id', component: () => import('@/views/CourseDetail.vue'), meta: { auth: true } },
    { path: '/editor/:assignmentId', component: () => import('@/views/Editor.vue'), meta: { auth: true } },
    { path: '/profile', component: () => import('@/views/Profile.vue'), meta: { auth: true } },
    {
      path: '/teacher/courses',
      component: () => import('@/views/teacher/Courses.vue'),
      meta: { auth: true, role: 'teacher' },
    },
    {
      path: '/teacher/courses/:id/edit',
      component: () => import('@/views/teacher/CourseEdit.vue'),
      meta: { auth: true, role: 'teacher' },
    },
    {
      path: '/teacher/assignments/:assignmentId/submissions',
      component: () => import('@/views/teacher/Submissions.vue'),
      meta: { auth: true, role: 'teacher' },
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.isLoggedIn) {
    return { path: '/login', query: { next: to.fullPath } };
  }
  if (to.meta.role === 'teacher' && !auth.isTeacher) {
    return { path: '/courses' };
  }
  if (to.meta.guest && auth.isLoggedIn) {
    return { path: auth.isTeacher ? '/teacher/courses' : '/courses' };
  }
  return true;
});

export default router;
