<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';
import { useAuthStore } from '@/stores/auth';

const courses = useCoursesStore();
const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  courses.loadAll();
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深啦,记得早点睡哦';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
});

function open(id: string) {
  if (auth.isTeacher) {
    router.push(`/teacher/courses/${id}/edit`);
  } else {
    router.push(`/courses/${id}`);
  }
}
</script>

<template>
  <section>
    <div class="hero card">
      <div class="hero-emoji">{{ auth.user?.avatarEmoji }}</div>
      <div>
        <h1 class="title">{{ greeting }},{{ auth.user?.displayName }}!</h1>
        <p class="muted">{{ auth.isTeacher ? '今天也要为同学们准备精彩的课程呀 👨‍🏫' : '挑一门课,开始你的编程冒险吧 🚀' }}</p>
      </div>
    </div>

    <h2 class="section-title">
      {{ auth.isTeacher ? '📚 我的课程' : '🌟 课程列表' }}
    </h2>

    <div v-if="courses.loading" class="empty">正在加载课程...</div>
    <div v-else-if="!courses.courses.length" class="empty">
      <div style="font-size: 64px">📭</div>
      <p>{{ auth.isTeacher ? '你还没有创建课程,点上面的"教师后台"去新建吧~' : '还没有开课的课程,先去注册一个老师账号邀请吧~' }}</p>
    </div>

    <div v-else class="grid">
      <article
        v-for="c in courses.courses"
        :key="c._id"
        class="course-card card"
        :class="{ unpublished: !c.published }"
        @click="open(c._id)"
      >
        <div class="cover">{{ c.coverEmoji }}</div>
        <h3 class="course-title">{{ c.title }}</h3>
        <p class="course-desc">{{ c.description || '这门课很有意思哦~' }}</p>
        <div class="course-meta">
          <span class="badge badge-info">📖 {{ c.lessons.length }} 节</span>
          <span v-if="auth.isTeacher" :class="['badge', c.published ? 'badge-success' : 'badge-warn']">
            {{ c.published ? '已发布' : '草稿' }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.hero {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, $primary-light 0%, #FFF8E1 100%);
}

.hero-emoji {
  font-size: 72px;
  line-height: 1;
}

.section-title {
  font-size: 24px;
  margin: 24px 0 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.course-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.course-card.unpublished {
  opacity: 0.7;
  border: 2px dashed $accent;
}

.cover {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 12px;
}

.course-title {
  font-size: 20px;
  margin: 0 0 8px;
}

.course-desc {
  color: $text-muted;
  font-size: 16px;
  margin: 0 0 12px;
  min-height: 48px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}
</style>
