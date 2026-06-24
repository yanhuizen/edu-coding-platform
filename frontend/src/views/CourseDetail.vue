<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MarkdownIt from 'markdown-it';
import { coursesApi } from '@/api/courses';
import { useAuthStore } from '@/stores/auth';
import type { Course, Assignment } from '@/types/models';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const course = ref<Course | null>(null);
const assignments = ref<Assignment[]>([]);
const activeLessonId = ref<string | null>(null);
const loading = ref(true);

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const html = computed(() => (course.value && activeLessonId.value
  ? md.render(course.value.lessons.find((l) => l._id === activeLessonId.value)?.contentMd ?? '')
  : ''));

const activeLesson = computed(() => course.value?.lessons.find((l) => l._id === activeLessonId.value) || null);

const activeAssignment = computed(() => {
  if (!activeLesson.value || !course.value) return null;
  return assignments.value.find((a) => a.lessonId === activeLesson.value!._id) || null;
});

const progress = computed(() => {
  if (!assignments.value.length) return 0;
  // 简化:不查每个作业的提交,只看课程是否"有作业"作为有内容的标志
  return 0;
});

onMounted(async () => {
  loading.value = true;
  try {
    const c = await coursesApi.get(route.params.id as string);
    course.value = c;
    assignments.value = await coursesApi.listAssignments(c._id);
    if (c.lessons.length) activeLessonId.value = c.lessons[0]._id;
  } catch (e: any) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
});

function gotoEditor() {
  if (activeAssignment.value) {
    router.push(`/editor/${activeAssignment.value._id}`);
  } else {
    alert('这个课时还没有作业,先去看看其他课时吧~');
  }
}
</script>

<template>
  <div v-if="loading" class="empty">加载中...</div>
  <div v-else-if="!course" class="empty">没有这门课</div>
  <div v-else class="course-detail">
    <header class="detail-head card">
      <div class="head-left">
        <div class="cover">{{ course.coverEmoji }}</div>
        <div>
          <h1 class="title">{{ course.title }}</h1>
          <p class="muted">{{ course.description }}</p>
        </div>
      </div>
      <div class="head-right">
        <span class="badge badge-info">📖 {{ course.lessons.length }} 节课时</span>
        <span class="badge badge-success">🎯 {{ assignments.length }} 个作业</span>
      </div>
    </header>

    <div class="detail-body">
      <aside class="lesson-list card">
        <h3 class="subtitle">📋 课时</h3>
        <ul>
          <li
            v-for="(l, i) in course.lessons"
            :key="l._id"
            :class="{ active: l._id === activeLessonId }"
            @click="activeLessonId = l._id"
          >
            <span class="num">{{ i + 1 }}</span>
            <span class="ltitle">{{ l.title }}</span>
            <span v-if="assignments.find((a) => a.lessonId === l._id)" class="badge badge-success dot">✏️</span>
          </li>
        </ul>
      </aside>

      <section class="lesson-content card">
        <div v-if="activeLesson">
          <h2 class="title">{{ activeLesson.title }}</h2>
          <div v-if="activeLesson.codeExample" class="code-example">
            <div class="ce-head">💡 示例代码</div>
            <pre><code>{{ activeLesson.codeExample }}</code></pre>
          </div>
          <div class="md" v-html="html" />
          <div class="actions">
            <button v-if="activeAssignment" class="btn" @click="gotoEditor">
              ✏️ 开始挑战 ({{ activeAssignment.title }})
            </button>
            <span v-else class="muted">本课时为阅读内容,无作业</span>
          </div>
        </div>
        <div v-else class="empty">请选择左侧课时</div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cover {
  font-size: 64px;
  line-height: 1;
}

.head-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.lesson-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lesson-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $radius;
  cursor: pointer;
  transition: background 0.15s;
}

.lesson-list li:hover {
  background: $primary-light;
}

.lesson-list li.active {
  background: $primary-light;
  color: $primary-dark;
  font-weight: 600;
}

.num {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $accent;
  color: #4a3500;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
}

.ltitle {
  flex: 1;
}

.dot {
  padding: 2px 6px;
}

.lesson-content {
  min-height: 400px;
}

.code-example {
  background: #263238;
  color: #ECEFF1;
  border-radius: $radius;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.ce-head {
  color: $accent;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: 'Source Han Sans CN', sans-serif;
}

.code-example pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 16px;
}

.md {
  line-height: 1.8;
}

.md :deep(h1) { font-size: 26px; margin-top: 0; }
.md :deep(h2) { font-size: 22px; }
.md :deep(p) { margin: 0.6em 0; }
.md :deep(code) {
  background: #F5F5F5;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.md :deep(pre) {
  background: #263238;
  color: #ECEFF1;
  padding: 16px 20px;
  border-radius: $radius;
  overflow-x: auto;
  font-size: 17px;
  line-height: 1.7;
  margin: 16px 0;
}

.md :deep(pre) code {
  background: transparent !important;
  padding: 0 !important;
  color: #ECEFF1 !important;
  font-size: inherit;
}
.md :deep(ul) { padding-left: 1.5em; }

.actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed $border;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}

@media (max-width: 720px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
}
</style>
