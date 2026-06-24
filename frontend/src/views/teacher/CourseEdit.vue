<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { coursesApi } from '@/api/courses';
import { assignmentsApi } from '@/api/assignments';
import type { Course, Assignment, Lesson } from '@/types/models';

const route = useRoute();
const router = useRouter();
const courseId = route.params.id as string;

const course = ref<Course | null>(null);
const assignments = ref<Assignment[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');

const newLessonTitle = ref('');
const newLessonMd = ref('');
const newLessonCode = ref('');

// 作业编辑弹窗
const editingAssignment = ref<Assignment | null>(null);
const showAssignmentModal = ref(false);
const aForm = ref({ title: '', prompt: '', starterCode: '', expectedOutput: '', totalScore: 100, lessonId: '' });

onMounted(async () => {
  await refresh();
});

async function refresh() {
  loading.value = true;
  try {
    course.value = await coursesApi.get(courseId);
    assignments.value = await coursesApi.listAssignments(courseId);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function addLesson() {
  if (!newLessonTitle.value.trim()) return;
  saving.value = true;
  try {
    course.value = await coursesApi.addLesson(courseId, {
      title: newLessonTitle.value.trim(),
      contentMd: newLessonMd.value,
      codeExample: newLessonCode.value,
      order: (course.value?.lessons.length ?? 0) + 1,
    });
    newLessonTitle.value = '';
    newLessonMd.value = '';
    newLessonCode.value = '';
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteLesson(lesson: Lesson) {
  if (!confirm(`确定删除课时"${lesson.title}"吗?`)) return;
  try {
    course.value = await coursesApi.deleteLesson(courseId, lesson._id);
  } catch (e: any) {
    alert(e.message);
  }
}

async function saveLesson(lesson: Lesson) {
  saving.value = true;
  try {
    course.value = await coursesApi.updateLesson(courseId, lesson._id, {
      title: lesson.title,
      contentMd: lesson.contentMd,
      codeExample: lesson.codeExample,
    });
    alert('已保存');
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

async function togglePublish() {
  if (!course.value) return;
  try {
    course.value = await coursesApi.update(courseId, { published: !course.value.published });
  } catch (e: any) {
    alert(e.message);
  }
}

async function updateMeta() {
  if (!course.value) return;
  saving.value = true;
  try {
    course.value = await coursesApi.update(courseId, {
      title: course.value.title,
      description: course.value.description,
      coverEmoji: course.value.coverEmoji,
    });
    alert('已保存');
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

function openNewAssignment(lessonId?: string) {
  aForm.value = { title: '', prompt: '', starterCode: '', expectedOutput: '', totalScore: 100, lessonId: lessonId ?? '' };
  editingAssignment.value = null;
  showAssignmentModal.value = true;
}

function openEditAssignment(a: Assignment) {
  editingAssignment.value = a;
  aForm.value = {
    title: a.title,
    prompt: a.prompt,
    starterCode: a.starterCode,
    expectedOutput: a.expectedOutput ?? '',
    totalScore: a.totalScore,
    lessonId: a.lessonId ?? '',
  };
  showAssignmentModal.value = true;
}

async function saveAssignment() {
  if (!aForm.value.title.trim()) {
    alert('请填写作业标题');
    return;
  }
  saving.value = true;
  try {
    if (editingAssignment.value) {
      await assignmentsApi.update(editingAssignment.value._id, aForm.value);
    } else {
      await assignmentsApi.create({ ...aForm.value, courseId });
    }
    showAssignmentModal.value = false;
    assignments.value = await coursesApi.listAssignments(courseId);
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteAssignment(a: Assignment) {
  if (!confirm(`确定删除作业"${a.title}"吗?`)) return;
  try {
    await assignmentsApi.remove(a._id);
    assignments.value = await coursesApi.listAssignments(courseId);
  } catch (e: any) {
    alert(e.message);
  }
}

function back() {
  router.push('/teacher/courses');
}
</script>

<template>
  <div v-if="loading" class="empty">加载中...</div>
  <div v-else-if="!course" class="empty">{{ error || '没有这门课' }}</div>
  <div v-else>
    <div class="head card">
      <button class="btn btn-ghost" @click="back">⬅️ 返回</button>
      <div class="head-mid">
        <input v-model="course.coverEmoji" maxlength="4" class="cover-input" />
        <input v-model="course.title" class="input title-input" />
      </div>
      <div class="row">
        <button class="btn btn-ghost" :disabled="saving" @click="updateMeta">💾 保存</button>
        <button class="btn" @click="togglePublish">
          {{ course.published ? '📥 取消发布' : '🚀 发布' }}
        </button>
      </div>
    </div>

    <div class="meta-row card">
      <label class="col">
        <span class="label">📝 课程简介</span>
        <textarea v-model="course.description" class="input" rows="2" maxlength="500"></textarea>
      </label>
    </div>

    <div class="row spread mt-24">
      <h2 class="subtitle">📖 课时 ({{ course.lessons.length }})</h2>
    </div>

    <div class="lesson-list">
      <div v-for="(l, i) in course.lessons" :key="l._id" class="card lesson-item">
        <div class="lesson-head">
          <span class="num">{{ i + 1 }}</span>
          <input v-model="l.title" class="input li-title" />
          <button class="btn btn-ghost btn-sm" @click="deleteLesson(l)">🗑️</button>
        </div>
        <div class="row" style="margin-top: 8px">
          <button class="btn btn-sm" @click="openNewAssignment(l._id)">➕ 课时作业</button>
          <span v-if="assignments.find((a) => a.lessonId === l._id)" class="muted">
            ✏️ 已有 {{ assignments.filter((a) => a.lessonId === l._id).length }} 个作业
          </span>
        </div>
        <textarea v-model="l.contentMd" class="input md-area" rows="6" placeholder="课时内容(Markdown)"></textarea>
        <textarea v-model="l.codeExample" class="input code-area" rows="3" placeholder="示例代码(可选)"></textarea>
        <div class="row">
          <button class="btn btn-ghost btn-sm" @click="saveLesson(l)">💾 保存课时</button>
        </div>
      </div>
    </div>

    <div class="add-lesson card">
      <h3 class="subtitle">➕ 添加新课时</h3>
      <input v-model="newLessonTitle" class="input" placeholder="课时标题" />
      <textarea v-model="newLessonMd" class="input" rows="3" placeholder="课时内容(Markdown)"></textarea>
      <textarea v-model="newLessonCode" class="input" rows="2" placeholder="示例代码(可选)"></textarea>
      <button class="btn" :disabled="saving" @click="addLesson">✅ 添加课时</button>
    </div>

    <div class="row spread mt-24">
      <h2 class="subtitle">🎯 作业 ({{ assignments.length }})</h2>
      <button class="btn btn-ghost" @click="openNewAssignment()">➕ 不绑定课时的作业</button>
    </div>

    <div v-if="!assignments.length" class="empty">还没有作业</div>
    <div v-else class="assignment-list">
      <div v-for="a in assignments" :key="a._id" class="card as-item">
        <div>
          <div class="row">
            <strong>📝 {{ a.title }}</strong>
            <span class="badge badge-info">🎯 {{ a.totalScore }} 分</span>
            <span v-if="a.expectedOutput" class="badge badge-success">自动判分</span>
            <span v-else class="badge badge-warn">人工批改</span>
          </div>
          <p class="muted ellipsis">{{ a.prompt || '无题目说明' }}</p>
        </div>
        <div class="row">
          <button class="btn btn-ghost btn-sm" @click="openEditAssignment(a)">✏️ 编辑</button>
          <button class="btn btn-ghost btn-sm" @click="router.push(`/teacher/assignments/${a._id}/submissions`)">📊 提交</button>
          <button class="btn btn-danger btn-sm" @click="deleteAssignment(a)">🗑️</button>
        </div>
      </div>
    </div>

    <!-- 作业编辑弹窗 -->
    <div v-if="showAssignmentModal" class="modal" @click.self="showAssignmentModal = false">
      <div class="modal-card card">
        <h2 class="title">{{ editingAssignment ? '✏️ 编辑作业' : '➕ 新建作业' }}</h2>
        <label class="col">
          <span class="label">📝 标题</span>
          <input v-model="aForm.title" class="input" maxlength="80" />
        </label>
        <label class="col">
          <span class="label">📋 题目说明</span>
          <textarea v-model="aForm.prompt" class="input" rows="3"></textarea>
        </label>
        <label class="col">
          <span class="label">⌨️ 起始代码</span>
          <textarea v-model="aForm.starterCode" class="input code-area" rows="4" placeholder="例如:&#10;name = input('你叫什么?')&#10;print('你好,' + name)"></textarea>
        </label>
        <label class="col">
          <span class="label">🎯 预期输出(留空 = 人工批改)</span>
          <textarea v-model="aForm.expectedOutput" class="input" rows="2" placeholder="完全匹配时通过,首尾空白忽略"></textarea>
        </label>
        <label class="col">
          <span class="label">⭐ 满分</span>
          <input v-model.number="aForm.totalScore" type="number" min="1" max="1000" class="input" />
        </label>
        <label class="col">
          <span class="label">🔗 绑定课时(可选)</span>
          <select v-model="aForm.lessonId" class="input">
            <option value="">不绑定</option>
            <option v-for="l in course.lessons" :key="l._id" :value="l._id">{{ l.title }}</option>
          </select>
        </label>
        <div class="row">
          <button class="btn" :disabled="saving" @click="saveAssignment">💾 保存</button>
          <button class="btn btn-ghost" @click="showAssignmentModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}

.head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.head-mid {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
}

.cover-input {
  width: 64px;
  height: 64px;
  font-size: 36px;
  text-align: center;
  border: 2px solid $border;
  border-radius: $radius;
  background: white;
  padding: 0;
}

.title-input {
  flex: 1;
  font-size: 22px;
  font-weight: 700;
}

.meta-row {
  margin-bottom: 20px;
}

.label {
  font-weight: 600;
  color: $text-muted;
}

.mt-24 {
  margin-top: 24px;
}

.spread {
  justify-content: space-between;
  width: 100%;
}

.lesson-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.lesson-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lesson-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.num {
  width: 32px;
  height: 32px;
  background: $accent;
  color: #4a3500;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.li-title {
  flex: 1;
  font-weight: 600;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.md-area, .code-area {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 14px;
}

.add-lesson {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  border: 2px dashed $accent;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.as-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 480px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-card {
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
