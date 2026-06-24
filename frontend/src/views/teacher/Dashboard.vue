<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWebSocket, type LogMessage } from '@/composables/useWebSocket';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { connect, disconnect, logs } = useWebSocket();

interface StudentRun {
  studentId: string;
  studentName: string;
  username: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId?: string;
  status: 'running' | 'success' | 'error';
  code?: string;
  output?: string;
  error?: string;
  ts: number;
}

const studentRuns = ref<Map<string, StudentRun>>(new Map());
const selectedStudent = ref<StudentRun | null>(null);

// 统计数据
const stats = computed(() => {
  const runs = Array.from(studentRuns.value.values());
  return {
    total: runs.length,
    running: runs.filter(r => r.status === 'running').length,
    success: runs.filter(r => r.status === 'success').length,
    error: runs.filter(r => r.status === 'error').length,
  };
});

// 最近 20 条活跃学生
const recentStudents = computed(() => {
  return Array.from(studentRuns.value.values())
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20);
});

onMounted(() => {
  // 教师连接到全局房间，接收所有学生的运行事件
  if (auth.isTeacher) {
    connect('global');
  }
});

onUnmounted(() => {
  disconnect();
});

// 处理 WebSocket 消息
onMounted(() => {
  // 监听 WebSocket 日志
  const checkLogs = setInterval(() => {
    const newLogs = logs.value;
    if (newLogs.length > 0) {
      newLogs.forEach(msg => {
        if (msg.type === 'run-start' || msg.type === 'run-end' || msg.type === 'error') {
          handleRunEvent(msg as any);
        }
      });
    }
  }, 500);
});

function handleRunEvent(msg: any) {
  const key = `${msg.studentId}-${msg.assignmentId}`;
  const existing = studentRuns.value.get(key);

  if (msg.type === 'run-start') {
    studentRuns.value.set(key, {
      studentId: msg.studentId,
      studentName: msg.studentName,
      username: msg.username,
      assignmentId: msg.assignmentId,
      assignmentTitle: msg.assignmentTitle,
      courseId: msg.courseId,
      status: 'running',
      ts: msg.ts,
    });
  } else if (msg.type === 'run-end' || msg.type === 'error') {
    const run = existing || {
      studentId: msg.studentId,
      studentName: msg.studentName,
      username: msg.username,
      assignmentId: msg.assignmentId,
      assignmentTitle: msg.assignmentTitle,
      courseId: msg.courseId,
      status: 'running',
      ts: msg.ts,
    };
    studentRuns.value.set(key, {
      ...run,
      status: msg.type === 'error' ? 'error' : 'success',
      code: msg.code || run.code,
      output: msg.output || run.output,
      error: msg.error,
      ts: msg.ts,
    });
  }
}

function selectStudent(run: StudentRun) {
  selectedStudent.value = run;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
</script>

<template>
  <div class="dashboard">
    <header class="dash-header card">
      <div class="dash-title">
        <span class="emoji">📊</span>
        <div>
          <h1 class="title">教师实时观察大屏</h1>
          <p class="muted">实时查看所有学生的代码运行情况</p>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat">
          <div class="stat-num">{{ stats.total }}</div>
          <div class="stat-label">总运行</div>
        </div>
        <div class="stat stat-running">
          <div class="stat-num">{{ stats.running }}</div>
          <div class="stat-label">运行中</div>
        </div>
        <div class="stat stat-success">
          <div class="stat-num">{{ stats.success }}</div>
          <div class="stat-label">成功</div>
        </div>
        <div class="stat stat-error">
          <div class="stat-num">{{ stats.error }}</div>
          <div class="stat-label">出错</div>
        </div>
      </div>
    </header>

    <div class="dash-body">
      <!-- 左侧：学生列表 -->
      <aside class="student-list card">
        <h3 class="subtitle">👥 学生运行动态</h3>
        <div v-if="!recentStudents.length" class="empty">
          <div style="font-size: 48px">⏳</div>
          <p>暂无学生运行记录</p>
          <p class="muted">当学生点击运行时，这里会显示</p>
        </div>
        <ul v-else class="student-ul">
          <li
            v-for="run in recentStudents"
            :key="`${run.studentId}-${run.assignmentId}`"
            :class="['student-item', { active: selectedStudent === run, [run.status]: true }]"
            @click="selectStudent(run)"
          >
            <div class="student-info">
              <span class="status-dot" :class="run.status"></span>
              <span class="student-name">{{ run.studentName }}</span>
            </div>
            <div class="assignment-name">{{ run.assignmentTitle }}</div>
            <div class="time">{{ formatTime(run.ts) }}</div>
          </li>
        </ul>
      </aside>

      <!-- 右侧：详情面板 -->
      <section class="detail-panel card">
        <div v-if="!selectedStudent" class="empty">
          <div style="font-size: 64px">👈</div>
          <p>点击左侧学生查看详情</p>
        </div>
        <div v-else>
          <div class="detail-header">
            <div>
              <h2 class="title">📝 {{ selectedStudent.studentName }}</h2>
              <p class="muted">{{ selectedStudent.assignmentTitle }}</p>
            </div>
            <span :class="['badge', selectedStudent.status === 'error' ? 'badge-danger' : selectedStudent.status === 'running' ? 'badge-warn' : 'badge-success']">
              {{ selectedStudent.status === 'running' ? '⏳ 运行中' : selectedStudent.status === 'error' ? '❌ 出错' : '✅ 成功' }}
            </span>
          </div>

          <div class="code-section">
            <div class="section-title">📄 代码</div>
            <pre class="code-block"><code>{{ selectedStudent.code || '(未记录)' }}</code></pre>
          </div>

          <div class="output-section">
            <div class="section-title">🖥️ 输出</div>
            <pre :class="['output-block', { error: selectedStudent.status === 'error' }]"><code>{{ selectedStudent.output || '(无输出)' }}</code></pre>
          </div>

          <div v-if="selectedStudent.error && selectedStudent.status === 'error'" class="error-section">
            <div class="section-title">⚠️ 错误信息</div>
            <pre class="error-block"><code>{{ selectedStudent.error }}</code></pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.dash-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.emoji {
  font-size: 48px;
}

.stats-row {
  display: flex;
  gap: 16px;
}

.stat {
  text-align: center;
  padding: 12px 24px;
  background: #F5F5F5;
  border-radius: $radius;
  min-width: 80px;
}

.stat-running {
  background: #FFF3E0;
}

.stat-success {
  background: #E8F5E9;
}

.stat-error {
  background: #FFEBEE;
}

.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: $primary-dark;
}

.stat-label {
  font-size: 14px;
  color: $text-muted;
}

.dash-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}

.student-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.student-ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-item {
  padding: 12px;
  border-radius: $radius;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;

  &:hover {
    background: $primary-light;
  }

  &.active {
    border-color: $primary;
    background: $primary-light;
  }

  &.running .status-dot { background: #FF9800; }
  &.success .status-dot { background: #4CAF50; }
  &.error .status-dot { background: #F44336; }
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  animation: pulse 1.5s infinite;

  &.success, &.error { animation: none; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.student-info {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.student-name {
  flex: 1;
}

.assignment-name {
  font-size: 14px;
  color: $text-muted;
  margin: 4px 0 4px 18px;
}

.time {
  font-size: 12px;
  color: $text-muted;
  margin-left: 18px;
}

.detail-panel {
  min-height: 400px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: $text-muted;
}

.code-section, .output-section, .error-section {
  margin-bottom: 16px;
}

.code-block, .output-block, .error-block {
  background: #1E1E1E;
  color: #ECEFF1;
  padding: 14px 18px;
  border-radius: $radius;
  overflow-x: auto;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 14px;
  white-space: pre-wrap;
  margin: 0;
}

.output-block.error {
  border-left: 4px solid #F44336;
}

.error-block {
  background: #2D1B1B;
  color: #FFCDD2;
  border-left: 4px solid #F44336;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}

@media (max-width: 960px) {
  .dash-body {
    grid-template-columns: 1fr;
  }

  .student-list {
    max-height: 300px;
  }
}
</style>
