<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { submissionsApi } from '@/api/submissions';
import { ref, onMounted } from 'vue';
import type { Submission } from '@/types/models';

const auth = useAuthStore();
const submissions = ref<Submission[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    submissions.value = await submissionsApi.mySubmissions();
  } catch (e: any) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
});

const stats = ref({ total: 0, passed: 0, graded: 0, score: 0 });
function refresh() {
  stats.value.total = submissions.value.length;
  stats.value.passed = submissions.value.filter((s) => s.status === 'passed' || s.status === 'graded').length;
  stats.value.graded = submissions.value.filter((s) => s.status === 'graded').length;
  stats.value.score = submissions.value.reduce((acc, s) => acc + (s.score ?? 0), 0);
}
onMounted(refresh);
</script>

<template>
  <section v-if="auth.user">
    <div class="profile-head card">
      <div class="avatar-big">{{ auth.user.avatarEmoji }}</div>
      <div>
        <h1 class="title">{{ auth.user.displayName }}</h1>
        <p class="muted">@{{ auth.user.username }} · {{ auth.isTeacher ? '老师' : '同学' }}</p>
      </div>
    </div>

    <div v-if="auth.isStudent" class="stats">
      <div class="stat card">
        <div class="num">{{ stats.total }}</div>
        <div class="label">📨 提交总数</div>
      </div>
      <div class="stat card">
        <div class="num">{{ stats.passed }}</div>
        <div class="label">✅ 通过数</div>
      </div>
      <div class="stat card">
        <div class="num">{{ stats.graded }}</div>
        <div class="label">👨‍🏫 已批改</div>
      </div>
      <div class="stat card">
        <div class="num">{{ stats.score }}</div>
        <div class="label">⭐ 累计得分</div>
      </div>
    </div>

    <h2 class="section-title">📜 我的提交记录</h2>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!submissions.length" class="empty">
      <div style="font-size: 64px">🌱</div>
      <p>还没有提交过作业,先去选门课开始挑战吧!</p>
    </div>
    <ul v-else class="sub-list">
      <li v-for="s in submissions" :key="s._id" class="card sub-item">
        <div class="sub-main">
          <div class="sub-title">
            <span v-if="s.status === 'passed'" class="badge badge-success">✅ 通过</span>
            <span v-else-if="s.status === 'graded'" class="badge badge-info">👨‍🏫 {{ s.score }} 分</span>
            <span v-else-if="s.status === 'failed'" class="badge badge-danger">❌ 未通过</span>
            <span v-else class="badge badge-warn">⏳ 待批改</span>
            <span class="muted">{{ new Date(s.submittedAt).toLocaleString() }}</span>
          </div>
          <div v-if="s.teacherComment" class="comment">💬 老师评语: {{ s.teacherComment }}</div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.profile-head {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-big {
  font-size: 80px;
  line-height: 1;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat {
  text-align: center;
  background: linear-gradient(135deg, $primary-light 0%, #FFF8E1 100%);
}

.num {
  font-size: 36px;
  font-weight: 800;
  color: $primary-dark;
}

.label {
  color: $text-muted;
  margin-top: 4px;
}

.section-title {
  font-size: 22px;
  margin: 16px 0;
}

.sub-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.comment {
  margin-top: 6px;
  background: #FFF8E1;
  padding: 8px 12px;
  border-radius: $radius;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: $text-muted;
}

@media (max-width: 720px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
