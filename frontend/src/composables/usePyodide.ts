import { ref, onMounted } from 'vue';

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;
const PYODIDE_VERSION = '0.26.2';

// 默认使用后端代理来获取 Pyodide 文件
// 如果代理失败,可以在 .env 中通过 VITE_PYODIDE_CDN 切换为直接 CDN
const PYODIDE_BASE_URL = (import.meta.env.VITE_PYODIDE_CDN || '/api/proxy/pyodide/') + 'v' + PYODIDE_VERSION + '/full/';

async function loadPyodideScript(): Promise<void> {
  if ((window as any).loadPyodide) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${PYODIDE_BASE_URL}pyodide.js`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('加载 Pyodide 失败,请检查网络或切换 CDN 源'));
    document.head.appendChild(s);
  });
}

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;
  pyodideLoading = (async () => {
    await loadPyodideScript();
    pyodideInstance = await (window as any).loadPyodide({
      indexURL: PYODIDE_BASE_URL,
    });
    setupInputMock();
    return pyodideInstance;
  })();
  return pyodideLoading;
}

function setupInputMock() {
  if (!pyodideInstance) return;
  pyodideInstance.runPython(`
import sys

def _browser_input(prompt=""):
    import js
    result = js.window.prompt(prompt)
    if result is None:
        return ""
    return str(result)

sys.modules['builtins'].input = _browser_input
`);
}

export interface ConsoleLog {
  type: 'stdout' | 'stderr' | 'system' | 'error';
  data: string;
  ts: number;
}

export function usePyodide() {
  const loading = ref(false);
  const loadingMessage = ref('');
  const running = ref(false);
  const ready = ref(false);
  const error = ref<string | null>(null);
  const logs = ref<ConsoleLog[]>([]);

  function log(type: ConsoleLog['type'], data: string) {
    logs.value.push({ type, data, ts: Date.now() });
  }

  function clear() {
    logs.value = [];
    error.value = null;
  }

  async function ensureReady() {
    if (ready.value) return;
    loading.value = true;
    loadingMessage.value = '正在召唤 Python 大象...';
    try {
      await getPyodide();
      ready.value = true;
    } catch (e: any) {
      error.value = e.message || 'Pyodide 加载失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function runCode(code: string): Promise<{ ok: boolean; output: string }> {
    clear();
    log('system', '⏳ 正在运行...');
    running.value = true;
    try {
      await ensureReady();
      const py = pyodideInstance;
      let stdout = '';
      let stderr = '';

      py.setStdout({
        batched: (s: string) => {
          stdout += s + '\n';
          log('stdout', s);
        },
      });
      py.setStderr({
        batched: (s: string) => {
          stderr += s + '\n';
          log('stderr', s);
        },
      });

      // 简单超时保护(单次 8s)
      const result = await Promise.race([
        py.runPythonAsync(code),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('运行时间过长(>8 秒),程序里可能有死循环,试着加个 break 或条件。')), 8000)
        ),
      ]);
      void result;
      log('system', '✅ 运行完成');
      return { ok: true, output: stdout };
    } catch (e: any) {
      const msg = e?.message || String(e);
      log('error', msg);
      return { ok: false, output: msg };
    } finally {
      running.value = false;
    }
  }

  async function resetPyodide() {
    if (pyodideInstance) {
      try {
        await pyodideInstance.runPythonAsync('import sys; sys.modules.clear()');
      } catch {
        // ignore
      }
    }
    clear();
  }

  onMounted(() => {
    // 不在这里预加载,等用户首次运行再加载(节省首屏)
  });

  return { loading, loadingMessage, running, ready, error, logs, runCode, clear, ensureReady, resetPyodide };
}
