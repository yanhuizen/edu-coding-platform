<script setup lang="ts">
import { computed } from 'vue';
import { translatePythonError } from '@/utils/pythonErrors';

interface Props {
  rawError: string;
  showRaw?: boolean;
}
const props = withDefaults(defineProps<Props>(), { showRaw: true });

const info = computed(() => translatePythonError(props.rawError));
</script>

<template>
  <div class="friendly-error">
    <div class="fe-head">
      <span class="emoji">{{ info.emoji }}</span>
      <span class="title">{{ info.title }}</span>
    </div>
    <div class="hint">💡 {{ info.hint }}</div>
    <details v-if="showRaw" class="raw-details">
      <summary>查看原始报错信息(给老师看)</summary>
      <pre>{{ info.raw }}</pre>
    </details>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.friendly-error {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%);
  border: 2px solid #FFCDD2;
  border-radius: $radius;
  padding: 14px 18px;
  margin-top: 12px;
}

.fe-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #B71C1C;
}

.emoji {
  font-size: 28px;
}

.hint {
  margin-top: 8px;
  color: #4E342E;
  font-size: 16px;
  font-weight: 500;
}

.raw-details {
  margin-top: 10px;
  font-size: 14px;
}

.raw-details summary {
  cursor: pointer;
  color: #5D4037;
  font-weight: 600;
}

.raw-details pre {
  background: rgba(0, 0, 0, 0.06);
  padding: 8px 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 13px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
