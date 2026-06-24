<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { submissionsApi } from '@/api/submissions';
import { assignmentsApi } from '@/api/assignments';
import type { Submission, Assignment } from '@/types/models';

const route = useRoute();
const router = useRouter();
const assignmentId = route.params.assignmentId as string;

const subs = ref<Submission[]>([]);
const assignment = ref<Assignment | null>(null);
const loading = ref(true);

const gradingId = ref<string | null>(null);
const gradeScore = ref(0);
const gradeComment = ref('');

onMounted(async () => {
  try {
    assignment.value = await assignmentsApi.get(assignmentId);
    subs.value = await submissionsApi.byAssignment(assignmentId);
  } catch (e: any) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
});

function fmtDate(s: string) {
  return new Date(s).toLocaleString();
}

function statusLabel(s: Submission['status']) {
  return {
    pending: { t: '⏳ 待批改', cls: 'badge-warn' },
    passed: { t: '✅ 已通过', cls: 'badge-success' },
    failed: { t: '❌ 未通过', cls: 'badge-danger' },
    graded: { t: '👨‍🏫 已批改', cls: 'badge-info' },
  }[s];
}

function openGrade(s: Submission) {
  gradingId.value = s._id;
  gradeScore.value = s.score ?? Math.round((assignment.value?.totalScore ?? 100) * 0.6);
  gradeComment.value = s.teacherComment ?? '';
}

async function submitGrade() {
  if (!gradingId.value) return;
  try {
    await submissionsApi.grade(gradingId.value, { score: gradeScore.value, comment: gradeComment.value });
    subs.value = await submissionsApi.byAssignment(assignmentId);
    gradingId.value = null;
  } catch (e: any) {
    alert(e.message);
  }
}

const passedCount = computed(() => subs.value.filter((s) => s.status === 'passed' || s.status === 'graded').length);
</script>

<template>
  <div v-if="loading" class="empty">加载中...</div>
  <div v-else-if="!assignment" class="empty">没有这个作业</div>
  <div v-else>
    <div class="head card">
      <button class="btn btn-ghost" @click="router.back()">⬅️ 返回</button>
      <div>
        <h1 class="title">📊 {{ assignment.title }} - 提交列表</h1>
        <p class="muted">满分 {{ assignment.totalScore }} 分 · 共 {{ subs.length }} 份提交 · {{ passedCount }} 份通过</p>
      </div>
    </div>

    <div v-if="!subs.length" class="empty">还没有同学提交哦~</div>
    <div v-else class="sub-list">
      <article v-for="s in subs" :key="s._id" class="card sub">
        <header class="sub-head">
          <div class="row">
            <span class="avatar">{{ (s.studentId as any).avatarEmoji || '🐼' }}</span>
            <strong>{{ (s.studentId as any).displayName || '同学' }}</strong>
            <span class="muted">@{{ (s.studentId as any).username }}</span>
            <span :class="['badge', statusLabel(s.status).cls]">{{ statusLabel(s.status).t }}</span>
            <span v-if="s.score != null" class="badge badge-info">⭐ {{ s.score }} 分</span>
          </div>
          <div class="muted">{{ fmtDate(s.submittedAt) }}</div>
        </header>

        <details class="code-block">
          <summary>📝 查看学生代码</summary>
          <pre>{{ s.code }}</pre>
        </details>

        <details v-if="s.output" class="code-block">
          <summary>🖥️ 查看运行输出</summary>
          <pre>{{ s.output }}</pre>
        </details>

        <div v-if="s.teacherComment" class="comment-card">
          💬 老师评语:{{ s.teacherComment }}
        </div>

        <div v-if="gradingId === s._id" class="grade-form card">
          <label class="col">
            <span class="label">⭐ 分数 (0 - {{ assignment.totalScore }})</span>
            <input v-model.number="gradeScore" type="number" min="0" :max="assignment.totalScore" class="input" />
          </label>
          <label class="col">
            <span class="label">💬 评语(可选)</span>
            <textarea v-model="gradeComment" class="input" rows="3" maxlength="500"></textarea>
          </label>
          <div class="row">
            <button class="btn" @click="submitGrade">💾 提交批改</button>
            <button class="btn btn-ghost" @click="gradingId = null">取消</button>
          </div>
        </div>
        <div v-else class="row">
          <button class="btn btn-ghost" @click="openGrade(s)">✏️ {{ s.status === 'graded' ? '改分' : '批改' }}</button>
        </div>
      </article>
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
  margin-bottom: 20px;
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.avatar {
  font-size: 28px;
}

.code-block {
  background: #1E1E1E;
  color: #ECEFF1;
  border-radius: $radius;
  padding: 8px 14px;
}

.code-block summary {
  cursor: pointer;
  font-weight: 600;
  color: $accent;
}

.code-block pre {
  margin: 8px 0 0;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 14px;
  max-height: 300px;
  overflow-y: auto;
}

.comment-card {
  background: linear-gradient(135deg, $primary-light 0%, #FFF8E1 100%);
  padding: 10px 14px;
  border-radius: $radius;
  font-weight: 500;
}

.grade-form {
  background: #FFF8E1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 600;
  color: $text-muted;
}
</style>
