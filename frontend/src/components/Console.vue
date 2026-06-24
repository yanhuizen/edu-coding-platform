<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { ConsoleLog } from '@/composables/usePyodide';

interface Props {
  logs: ConsoleLog[];
  status?: 'idle' | 'loading' | 'running' | 'success' | 'error';
  message?: string;
}
const props = withDefaults(defineProps<Props>(), { status: 'idle', message: '' });

const listEl = ref<HTMLDivElement | null>(null);

watch(
  () => props.logs.length,
  async () => {
    await nextTick();
    if (listEl.value) {
      listEl.value.scrollTop = listEl.value.scrollHeight;
    }
  }
);
</script>

<template>
  <div class="console-wrap">
    <div class="console-head">
      <span class="title">🖥️ 运行结果</span>
      <span :class="['status', status]">
        <span v-if="status === 'loading'">⏳ 加载中...</span>
        <span v-else-if="status === 'running'">⏳ 运行中...</span>
        <span v-else-if="status === 'success'">✅ 运行成功</span>
        <span v-else-if="status === 'error'">❌ 出错了</span>
        <span v-else>💤 等待运行</span>
      </span>
    </div>
    <div ref="listEl" class="console-body">
      <div v-if="!logs.length" class="empty">还没有输出哦~ 点上面的"▶️ 运行"试试看!</div>
      <div
        v-for="(l, i) in logs"
        :key="i"
        :class="['log-line', l.type]"
      >
        <span class="prefix" v-if="l.type === 'stdout'">›</span>
        <span class="prefix" v-else-if="l.type === 'stderr'">!</span>
        <span class="prefix" v-else-if="l.type === 'error'">✗</span>
        <span class="prefix" v-else>·</span>
        <pre class="data">{{ l.data }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.console-wrap {
  background: #1E1E1E;
  color: #ECEFF1;
  border-radius: $radius;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  max-height: 400px;
}

.console-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #263238;
  font-weight: 600;
  border-bottom: 1px solid #37474F;
}

.title {
  color: $accent;
}

.status {
  font-size: 14px;
  padding: 2px 10px;
  border-radius: $radius-pill;
}

.status.idle { background: #455A64; }
.status.loading, .status.running { background: $info; }
.status.success { background: $success; }
.status.error { background: $danger; }

.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 16px;
  line-height: 1.5;
}

.empty {
  color: #B0BEC5;
  text-align: center;
  padding: 40px 0;
}

.log-line {
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.prefix {
  color: $accent;
  font-weight: 700;
  width: 16px;
  flex-shrink: 0;
}

.log-line.stderr .prefix, .log-line.error .prefix {
  color: #FF8A80;
}

.log-line.system {
  color: #B9F6CA;
}

.log-line.system .prefix {
  color: #69F0AE;
}

.data {
  margin: 0;
  flex: 1;
  font-family: inherit;
}
</style>
