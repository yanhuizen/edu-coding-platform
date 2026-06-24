// Python 错误 → 中文友好提示
// 提取 Pyodide 的 traceback,匹配常见错误并给出适合小学生的解释

export interface FriendlyError {
  emoji: string;
  title: string;
  hint: string;
  raw: string;
}

const PATTERNS: { re: RegExp; emoji: string; title: string; hint: string }[] = [
  {
    re: /NameError\s*:\s*name\s*'([^']+)'/,
    emoji: '🤔',
    title: "这个名字你好像没告诉过 Python 哦~",
    hint: "试试在前面加一行: m = '你的名字',把名字告诉 Python",
  },
  {
    re: /SyntaxError/,
    emoji: '📝',
    title: '代码写错啦!',
    hint: '检查一下冒号(:)、缩进(4 个空格)、引号(成对出现),是不是哪里漏了?',
  },
  {
    re: /IndentationError/,
    emoji: '📏',
    title: '缩进不对哦~',
    hint: 'Python 对缩进很敏感!同一段代码的缩进要一致,建议统一用 4 个空格。',
  },
  {
    re: /TypeError\s*:\s*.*can only concatenate\s+str\s*\(not\s+"([^"]+)"\)\s+to\s+str/,
    emoji: '🔢',
    title: '字符串和数字不能直接加一起!',
    hint: '用 str(数字) 把数字变成文字,例如:print("你今年 " + str(8) + " 岁")',
  },
  {
    re: /TypeError/,
    emoji: '🔢',
    title: '类型不对哦~',
    hint: '看看是不是把数字和文字混着用了,或者函数参数类型不对。',
  },
  {
    re: /IndexError/,
    emoji: '📦',
    title: '列表没有这个位置啦~',
    hint: '列表下标从 0 开始!长度为 3 的列表,最后一个是 [2]。',
  },
  {
    re: /ZeroDivisionError/,
    emoji: '💥',
    title: '除数不能为 0 哦!',
    hint: '检查一下除法右边是不是 0,或者可能是 0 的变量。',
  },
  {
    re: /ValueError\s*:\s*invalid literal for int\(\)/,
    emoji: '🔤',
    title: '不能把这段文字变成数字哦',
    hint: 'int("123") 可以,int("abc") 就不行。先确认输入的是不是数字。',
  },
  {
    re: /ValueError/,
    emoji: '🤨',
    title: '数值不对~',
    hint: '检查一下输入的内容,或者是不是转换类型时写错了。',
  },
  {
    re: /KeyError\s*:\s*'([^']+)'/,
    emoji: '🔑',
    title: '字典里没有这个 key 哦~',
    hint: '检查一下 key 名是不是写错了,或者用 in 先判断: if k in d: ...',
  },
  {
    re: /AttributeError\s*:\s*'([^']+)'\s+object\s+has\s+no\s+attribute\s+'([^']+)'/,
    emoji: '🚫',
    title: '这种东西没有这个功能!',
    hint: '可能是类型搞错了,或者函数名写错,Python 找不到。',
  },
  {
    re: /ImportError|ModuleNotFoundError/,
    emoji: '📚',
    title: '找不到这个模块~',
    hint: '检查一下模块名是不是写错,或者大小写不对。',
  },
  {
    re: /OSError.*I\/O error|Errno.*29/,
    emoji: '🖥️',
    title: '浏览器不支持 input() 函数!',
    hint: '在浏览器里运行时,input() 需要用弹窗输入。如果还是报错,请刷新页面重试。',
  },
  {
    re: /RecursionError/,
    emoji: '🔄',
    title: '函数自己调自己太多次啦!',
    hint: '是不是忘记写"结束条件"了?检查一下函数最后会不会回到起点。',
  },
];

export function translatePythonError(raw: string): FriendlyError {
  for (const p of PATTERNS) {
    const m = raw.match(p.re);
    if (m) {
      return { emoji: p.emoji, title: p.title, hint: p.hint, raw };
    }
  }
  return { emoji: '⚠️', title: '程序跑出错了', hint: '仔细看上面的红色提示,或者问问老师~', raw };
}
