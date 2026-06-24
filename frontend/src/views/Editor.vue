<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { assignmentsApi } from '@/api/assignments';
import { submissionsApi } from '@/api/submissions';
import { coursesApi } from '@/api/courses';
import { usePyodide } from '@/composables/usePyodide';
import { useAuthStore } from '@/stores/auth';
import CodeEditor from '@/components/CodeEditor.vue';
import Console from '@/components/Console.vue';
import FriendlyError from '@/components/FriendlyError.vue';
import type { Assignment } from '@/types/models';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const assignment = ref<Assignment | null>(null);
const courseTitle = ref('');
const code = ref<string>('');
const submitted = ref<{ ok: boolean; message: string } | null>(null);
const submitting = ref(false);
const lastOutput = ref('');

const { logs, runCode, running, clear, ensureReady, loading, loadingMessage } = usePyodide();

const status = computed<'idle' | 'loading' | 'running' | 'success' | 'error'>(() => {
  if (loading.value) return 'loading';
  if (running.value) return 'running';
  if (logs.value.some((l) => l.type === 'error')) return 'error';
  if (logs.value.some((l) => l.type === 'stdout' || l.type === 'system')) return 'success';
  return 'idle';
});

const lastError = computed(() => {
  const err = [...logs.value].reverse().find((l) => l.type === 'error');
  return err?.data || '';
});

onMounted(async () => {
  const id = route.params.assignmentId as string;
  try {
    const a = await assignmentsApi.get(id);
    assignment.value = a;
    code.value = a.starterCode;
    const c = await coursesApi.get(a.courseId);
    courseTitle.value = c.title;
  } catch (e: any) {
    alert(e.message);
  }
});

async function onRun() {
  if (!assignment.value) return;
  submitted.value = null;
  clear();
  const r = await runCode(code.value);
  lastOutput.value = r.output;
  if (r.ok && assignment.value.expectedOutput) {
    const expected = (assignment.value.expectedOutput ?? '').trim();
    const actual = (r.output ?? '').trim();
    if (expected === actual) {
      submitted.value = { ok: true, message: '🎉 运行结果与预期一致,你可以提交啦!' };
    } else {
      submitted.value = { ok: false, message: '运行了,但输出和预期不一样哦,再检查一下?' };
    }
  } else if (!r.ok) {
    submitted.value = { ok: false, message: '出错了,先看下面的提示修一下吧~' };
  }
}

async function onSubmit() {
  if (!assignment.value) return;
  if (!auth.isStudent) {
    alert('只有学生账号可以提交作业');
    return;
  }
  submitting.value = true;
  try {
    const s = await submissionsApi.submit({
      assignmentId: assignment.value._id,
      code: code.value,
      output: lastOutput.value,
    });
    let msg = '🎉 已提交!';
    if (s.status === 'passed') msg = '🎉 已提交,系统判定为通过!';
    else if (s.status === 'failed') msg = '📝 已提交,系统判定未通过,看看哪里输出不对?';
    submitted.value = { ok: s.status !== 'failed', message: msg };
  } catch (e: any) {
    alert(e.message);
  } finally {
    submitting.value = false;
  }
}

function back() {
  if (assignment.value) {
    router.push(`/courses/${assignment.value.courseId}`);
  } else {
    router.back();
  }
}
</script>

<template>
  <div v-if="!assignment" class="empty">加载作业中...</div>
  <div v-else class="editor-page">
    <div class="head card">
      <div class="head-left">
        <button class="btn btn-ghost" @click="back">⬅️ 返回课程</button>
        <div>
          <h1 class="title">📝 {{ assignment.title }}</h1>
          <p class="muted">{{ courseTitle }}</p>
        </div>
      </div>
      <div class="head-right">
        <span class="badge badge-info">🎯 满分 {{ assignment.totalScore }}</span>
      </div>
    </div>

    <div class="body">
      <div class="left col">
        <div class="card">
          <h3 class="subtitle">📋 题目</h3>
          <p class="prompt">{{ assignment.prompt || '按要求写代码吧~' }}</p>
          <div v-if="assignment.expectedOutput" class="expected">
            <strong>🎯 预期输出:</strong>
            <pre>{{ assignment.expectedOutput }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="row spread">
            <h3 class="subtitle">⌨️ 代码编辑器</h3>
            <div class="row">
              <button class="btn" :disabled="running || loading" @click="onRun">
                <span v-if="loading">⏳ 加载中</span>
                <span v-else-if="running">⏳ 运行中</span>
                <span v-else>▶️ 运行</span>
              </button>
              <button class="btn btn-secondary" :disabled="submitting" @click="onSubmit">
                {{ submitting ? '提交中...' : '📤 提交' }}
              </button>
            </div>
          </div>
          <CodeEditor v-model="code" language="python" height="380px" />
          <div v-if="loadingMessage" class="loading-tip">🐢 {{ loadingMessage }}</div>
        </div>
      </div>

      <div class="right col">
        <Console :logs="logs" :status="status" />
        <FriendlyError v-if="lastError" :rawError="lastError" />
        <div v-if="submitted" :class="['card', 'result', submitted.ok ? 'good' : 'bad']">
          <div class="result-emoji">{{ submitted.ok ? '🎉' : '💪' }}</div>
          <div class="result-msg">{{ submitted.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.empty {
  text-align: center;
  padding: 80px 20px;
  color: $text-muted;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.head-right {
  display: flex;
  gap: 8px;
}

.body {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}

.left, .right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spread {
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
}

.prompt {
  white-space: pre-wrap;
  color: $text;
  line-height: 1.7;
}

.expected {
  margin-top: 10px;
  background: #FFF8E1;
  padding: 10px 14px;
  border-radius: $radius;
}

.expected pre {
  margin: 6px 0 0;
  background: #1E1E1E;
  color: #ECEFF1;
  padding: 10px 14px;
  border-radius: 6px;
  white-space: pre-wrap;
}

.loading-tip {
  margin-top: 8px;
  text-align: center;
  color: $text-muted;
  font-weight: 600;
}

.result {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result.good {
  background: linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%);
  border: 2px solid $primary;
}

.result.bad {
  background: linear-gradient(135deg, #FFECB3 0%, #FFE0B2 100%);
  border: 2px solid $accent-dark;
}

.result-emoji {
  font-size: 36px;
}

.result-msg {
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .body {
    grid-template-columns: 1fr;
  }
}
</style>
