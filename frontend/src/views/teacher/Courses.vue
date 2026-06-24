<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCoursesStore } from '@/stores/courses';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const courses = useCoursesStore();

const showNew = ref(false);
const newTitle = ref('');
const newDesc = ref('');
const newEmoji = ref('📘');
const creating = ref(false);
const error = ref('');

onMounted(() => {
  courses.loadAll();
});

const emojiList = ['📘', '📗', '📕', '📙', '🚀', '🎮', '🐍', '🤖', '🎨', '🌈', '⭐', '🔥', '💡', '🎯', '🧩', '🌍'];

async function create() {
  error.value = '';
  if (!newTitle.value.trim()) {
    error.value = '请填写课程标题';
    return;
  }
  creating.value = true;
  try {
    const c = await courses.createCourse({
      title: newTitle.value.trim(),
      description: newDesc.value.trim(),
      coverEmoji: newEmoji.value,
    });
    showNew.value = false;
    newTitle.value = '';
    newDesc.value = '';
    router.push(`/teacher/courses/${c._id}/edit`);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <section>
    <div class="head card">
      <div>
        <h1 class="title">👨‍🏫 教师后台</h1>
        <p class="muted">管理你的课程和作业</p>
      </div>
      <button class="btn" @click="showNew = !showNew">➕ 新建课程</button>
    </div>

    <div v-if="showNew" class="card new-form">
      <h3 class="subtitle">📚 新建一门课</h3>
      <label class="col">
        <span class="label">😀 选个封面 emoji</span>
        <div class="emoji-row">
          <button
            v-for="e in emojiList"
            :key="e"
            type="button"
            class="emoji-btn"
            :class="{ active: newEmoji === e }"
            @click="newEmoji = e"
          >{{ e }}</button>
        </div>
      </label>
      <label class="col">
        <span class="label">📚 课程标题</span>
        <input v-model="newTitle" class="input" placeholder="例如:Python 入门第一课" maxlength="60" />
      </label>
      <label class="col">
        <span class="label">📝 简介(可选)</span>
        <textarea v-model="newDesc" class="input" rows="3" maxlength="500" placeholder="一句话介绍这门课..."></textarea>
      </label>
      <div v-if="error" class="err">⚠️ {{ error }}</div>
      <div class="row">
        <button class="btn" :disabled="creating" @click="create">✅ 创建</button>
        <button class="btn btn-ghost" @click="showNew = false">取消</button>
      </div>
    </div>

    <div v-if="courses.loading" class="empty">加载中...</div>
    <div v-else-if="!courses.courses.length" class="empty">
      <div style="font-size: 64px">📭</div>
      <p>还没有课程,点上面的"➕ 新建课程"开始吧~</p>
    </div>
    <div v-else class="grid">
      <article
        v-for="c in courses.courses"
        :key="c._id"
        class="course-card card"
        @click="router.push(`/teacher/courses/${c._id}/edit`)"
      >
        <div class="cover">{{ c.coverEmoji }}</div>
        <h3 class="ct">{{ c.title }}</h3>
        <p class="muted">{{ c.description || '这门课很有意思哦~' }}</p>
        <div class="meta">
          <span class="badge badge-info">📖 {{ c.lessons.length }} 节</span>
          <span :class="['badge', c.published ? 'badge-success' : 'badge-warn']">
            {{ c.published ? '✅ 已发布' : '📝 草稿' }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.new-form {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: $text-muted;
}

.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emoji-btn {
  width: 44px;
  height: 44px;
  font-size: 24px;
  border: 2px solid $border;
  background: white;
  border-radius: $radius;
  padding: 0;
}

.emoji-btn.active {
  border-color: $primary;
  background: $primary-light;
}

.err {
  background: #FFEBEE;
  color: #B71C1C;
  padding: 10px 14px;
  border-radius: $radius;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.course-card {
  cursor: pointer;
  transition: transform 0.15s;
}

.course-card:hover {
  transform: translateY(-3px);
}

.cover {
  font-size: 64px;
  margin-bottom: 8px;
}

.ct {
  margin: 0 0 6px;
  font-size: 20px;
}

.meta {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}
</style>
