<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

interface Props {
  modelValue?: string;
  language?: string;
  height?: string;
  readonly?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'python',
  height: '400px',
  readonly: false,
});

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const editorRef = ref<HTMLDivElement | null>(null);
let editor: any = null;
let monacoLib: any = null;

async function init() {
  // 动态加载 monaco-editor
  const monaco = await import('monaco-editor/esm/vs/editor/editor.api');
  monacoLib = monaco;
  // 设置 monaco 环境(避免 worker 加载报错)
  (self as any).MonacoEnvironment = {
    getWorker: () => {
      // 用简单的 worker 桩
      return new Worker(
        URL.createObjectURL(new Blob(['self.onmessage=()=>{}'], { type: 'text/javascript' }))
      );
    },
  };

  editor = monaco.editor.create(editorRef.value!, {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    fontSize: 18,
    fontFamily: 'JetBrains Mono, Consolas, Menlo, monospace',
    tabSize: 4,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    readOnly: props.readonly,
    renderLineHighlight: 'all',
    wordWrap: 'on',
  });

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue());
  });
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
});

watch(
  () => props.modelValue,
  (v) => {
    if (editor && editor.getValue() !== v) {
      editor.setValue(v ?? '');
    }
  }
);

function getValue() {
  return editor?.getValue() ?? '';
}

function setValue(v: string) {
  editor?.setValue(v);
  emit('update:modelValue', v);
}

function reset(v: string) {
  setValue(v);
}

defineExpose({ getValue, setValue, reset });
</script>

<template>
  <div ref="editorRef" class="code-editor" :style="{ height }" />
</template>

<style lang="scss" scoped>
.code-editor {
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}
</style>
