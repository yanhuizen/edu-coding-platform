/**
 * 灌入 7 节示例课程 + 教师账号
 * 使用: cd backend && npm run seed:courses
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectMongo } from '../src/config/mongoose';
import { User } from '../src/models/User';
import { Course } from '../src/models/Course';
import { Assignment } from '../src/models/Assignment';
import { hashPassword } from '../src/utils/password';
import { isValidInviteCode } from '../src/utils/inviteCode';

interface SeedLesson {
  title: string;
  contentMd: string;
  codeExample: string;
  assignment: {
    title: string;
    prompt: string;
    starterCode: string;
    expectedOutput?: string;
    totalScore: number;
  };
}

const TEACHER = {
  username: 'teacher',
  displayName: '王老师',
  password: '123456',
  inviteCode: 'DEMO2026',
};

const COURSE = {
  title: '小象的 Python 入门课',
  description: '为 5-6 年级同学设计的 Python 入门课,从 print 到 for 循环,一起玩转编程~',
  coverEmoji: '🐘',
};

const LESSONS: SeedLesson[] = [
  {
    title: '第 1 课:你好,世界!',
    contentMd: `# 你好,世界!

欢迎来到 Python 的世界!我们第一个程序,就是让电脑和我们"打招呼"。

## 什么是 \`print\`?

\`print\` 是 Python 的"嘴巴",把括号里的内容"说"出来。

\`\`\`python
print("你好,世界!")
\`\`\`

> 📌 注意:
> - 文字要用 **英文引号** 括起来(\`"你好"\` 或 \`'你好'\`)
> - 引号必须是 **成对** 出现
> - 每行代码写完不需要加分号

## 🎮 试试看

在右边的编辑器里,写一行让电脑说"Hello!"的代码,然后点"▶️ 运行"。
`,
    codeExample: 'print("你好,世界!")',
    assignment: {
      title: '说出你的第一句话',
      prompt: '用 print 让电脑说:你好,Python!\n\n要求:\n- 输出一行,内容是 你好,Python!\n- 注意标点必须是英文感叹号',
      starterCode: '# 在下面写一行 print,让电脑打招呼~\n',
      expectedOutput: '你好,Python!',
      totalScore: 100,
    },
  },
  {
    title: '第 2 课:变量 - 给数据起名字',
    contentMd: `# 变量 - 给数据起名字

想象你有一个神奇的盒子,可以把东西放进去,还贴上名字方便以后拿。

## 怎么做?

\`\`\`python
name = "小明"
age = 10
print(name)
print(age)
\`\`\`

- \`name\` 是盒子名字(变量名)
- \`"小明"\` 是盒子里的东西(值)
- \`=\` 是"装进去"的意思

## 规则

- 名字只能包含字母、数字、下划线
- 不能以数字开头
- 不能用 Python 的"保留字"(比如 \`if\`、\`for\`、\`print\`)
`,
    codeExample: 'name = "小红"\nprint("我叫 " + name)',
    assignment: {
      title: '自我介绍',
      prompt: '创建一个变量 name,把你的名字赋给它,然后用 print 输出:`我是 ` + name + `!`\n\n例如:如果 name = "小红",输出  我是小红!',
      starterCode: '# 1. 创建一个变量 name,把你的名字放进去\n# 2. 用 print 输出: 我是 <你的名字>!\n',
      expectedOutput: '我是小象!',
      totalScore: 100,
    },
  },
  {
    title: '第 3 课:数字运算',
    contentMd: `# 数字运算

Python 还是一个超强的计算器!

## 基本运算

| 符号 | 意思 | 例子 |
|------|------|------|
| \`+\` | 加 | \`3 + 2\` → 5 |
| \`-\` | 减 | \`10 - 4\` → 6 |
| \`*\` | 乘 | \`6 * 7\` → 42 |
| \`/\` | 除(有小数) | \`10 / 3\` → 3.333... |
| \`//\` | 整除 | \`10 // 3\` → 3 |
| \`%\` | 取余 | \`10 % 3\` → 1 |
| \`**\` | 乘方 | \`2 ** 3\` → 8 |
`,
    codeExample: 'a = 10\nb = 3\nprint("和 =", a + b)\nprint("余 =", a % b)',
    assignment: {
      title: '算一算',
      prompt: '计算 1234 + 5678 的结果,用 print 输出。\n(直接输出数字就行)',
      starterCode: '# 算 1234 + 5678,然后 print 出来\n',
      expectedOutput: '6912',
      totalScore: 100,
    },
  },
  {
    title: '第 4 课:输入与输出',
    contentMd: `# 输入与输出

让程序和你"对话"!

## \`input()\`

\`input\` 会暂停,等用户在键盘上输入点什么,按回车后,把输入的内容"给"回来。

\`\`\`python
name = input("你叫什么名字? ")
print("你好," + name + "!")
\`\`\`

> ⚠️ \`input()\` 拿到的 **总是文字**(字符串),要做数学运算要先用 \`int()\` 转换:
> \`\`\`python
> age = int(input("你多大了? "))
> print("明年你就", age + 1, "岁了")
> \`\`\`
`,
    codeExample: 'name = input("你叫什么? ")\nprint("欢迎你," + name)',
    assignment: {
      title: '问好程序',
      prompt: '写一个程序:\n1. 用 input 问 "你叫什么名字? ",把结果存到 name\n2. 用 print 输出:你好,<name>!欢迎来到 Python 世界!\n\n例:输入"小明" → 输出 你好,小明!欢迎来到 Python 世界!',
      starterCode: '# 写你的程序\n',
      totalScore: 100,
    },
  },
  {
    title: '第 5 课:条件判断',
    contentMd: `# 条件判断

让程序学会"做选择"!

## \`if ... else\`

\`\`\`python
age = int(input("你几岁? "))
if age >= 18:
    print("你是大人啦")
else:
    print("你还是小朋友")
\`\`\`

> ⚠️ Python 用 **缩进**(4 个空格)表示"这段代码属于 if 里面"

## 比较运算

| 符号 | 意思 |
|------|------|
| \`==\` | 等于 |
| \`!=\` | 不等于 |
| \`>\` | 大于 |
| \`<\` | 小于 |
| \`>=\` | 大于等于 |
| \`<=\` | 小于等于 |
`,
    codeExample: 'score = 85\nif score >= 60:\n    print("及格啦!")\nelse:\n    print("继续加油!")',
    assignment: {
      title: '及格判断',
      prompt: '写一个程序:\n1. 创建一个变量 score = 75\n2. 如果 score >= 60,print "及格"\n3. 否则 print "不及格"\n(直接输出"及格"或"不及格",不要带引号)',
      starterCode: 'score = 75\n# 写 if 判断\n',
      expectedOutput: '及格',
      totalScore: 100,
    },
  },
  {
    title: '第 6 课:循环',
    contentMd: `# 循环 - 让代码重复跑

电脑最擅长"重复"!

## \`for\` 循环

\`\`\`python
for i in range(5):
    print("第", i + 1, "次")
\`\`\`

会输出 5 次。\`range(5)\` 是 0、1、2、3、4。

## \`while\` 循环

\`\`\`python
n = 1
while n <= 5:
    print(n)
    n = n + 1
\`\`\`

> ⚠️ \`while\` 一定要有"结束条件",不然会死循环!
`,
    codeExample: 'for i in range(3):\n    print("哈喽!")',
    assignment: {
      title: '数到 5',
      prompt: '用 for 循环和 print,分别输出 1、2、3、4、5(每个数字一行)',
      starterCode: '# 用 for 循环输出 1 到 5\n',
      expectedOutput: '1\n2\n3\n4\n5',
      totalScore: 100,
    },
  },
  {
    title: '第 7 课:列表',
    contentMd: `# 列表 - 装很多东西的盒子

## 什么是列表?

\`\`\`python
fruits = ["苹果", "香蕉", "橘子"]
print(fruits[0])  # 苹果
print(len(fruits))  # 3
\`\`\`

> 📌 列表下标从 **0** 开始!\`fruits[0]\` 是第一个,不是第二个。

## 常用操作

- \`fruits[0]\` 取第 1 个
- \`fruits.append("西瓜")\` 加一个
- \`len(fruits)\` 数有几个
`,
    codeExample: 'nums = [3, 1, 4, 1, 5]\nnums.append(9)\nprint(nums)',
    assignment: {
      title: '班级名单',
      prompt: '1. 创建一个列表 names,包含 "小明"、"小红"、"小刚"\n2. 用 print 输出列表长度(3)',
      starterCode: '# 创建列表,然后输出长度\n',
      expectedOutput: '3',
      totalScore: 100,
    },
  },
];

async function runSeed() {
  await connectMongo();

  // 1. 创建教师
  const existingTeacher = await User.findOne({ username: TEACHER.username });
  let teacher = existingTeacher;
  if (!teacher) {
    if (!isValidInviteCode(TEACHER.inviteCode)) {
      throw new Error(`invite code ${TEACHER.inviteCode} not valid in env`);
    }
    teacher = await User.create({
      username: TEACHER.username,
      passwordHash: await hashPassword(TEACHER.password),
      displayName: TEACHER.displayName,
      avatarEmoji: '👨‍🏫',
      role: 'teacher',
    });
    console.log(`[seed] created teacher: ${TEACHER.username} / ${TEACHER.password}`);
  } else {
    console.log(`[seed] teacher already exists: ${TEACHER.username}`);
  }

  // 2. 创建/更新课程
  let course = await Course.findOne({ title: COURSE.title, createdBy: teacher._id });
  if (!course) {
    course = await Course.create({
      title: COURSE.title,
      description: COURSE.description,
      coverEmoji: COURSE.coverEmoji,
      order: 1,
      createdBy: teacher._id,
      published: true,
    });
    console.log(`[seed] created course: ${COURSE.title}`);
  } else {
    console.log(`[seed] course already exists: ${COURSE.title}`);
  }

  // 3. 灌入课时
  for (let i = 0; i < LESSONS.length; i++) {
    const L = LESSONS[i];
    const lessonId = course.lessons[i]?._id;
    if (!lessonId) {
      course.lessons.push({
        title: L.title,
        contentMd: L.contentMd,
        codeExample: L.codeExample,
        order: i + 1,
      } as any);
    } else {
      const exist = course.lessons[i];
      exist.title = L.title;
      exist.contentMd = L.contentMd;
      exist.codeExample = L.codeExample;
      exist.order = i + 1;
    }
  }
  await course.save();
  console.log(`[seed] lessons synced: ${course.lessons.length}`);

  // 4. 灌入作业
  for (let i = 0; i < LESSONS.length; i++) {
    const L = LESSONS[i];
    const lessonId = (course.lessons[i] as any)._id;
    const existing = await Assignment.findOne({ courseId: course._id, title: L.assignment.title });
    if (existing) {
      console.log(`[seed]   - assignment exists: ${L.assignment.title}`);
      continue;
    }
    await Assignment.create({
      courseId: course._id,
      lessonId,
      title: L.assignment.title,
      prompt: L.assignment.prompt,
      starterCode: L.assignment.starterCode,
      expectedOutput: L.assignment.expectedOutput,
      totalScore: L.assignment.totalScore,
    });
    console.log(`[seed]   + created assignment: ${L.assignment.title}`);
  }
}

export { runSeed };

async function main() {
  await runSeed();
  console.log('\n✅ Seed 完成!登录信息:');
  console.log(`   教师: ${TEACHER.username} / ${TEACHER.password} (邀请码 ${TEACHER.inviteCode})`);
  console.log(`   学生: 自己注册即可`);
  await mongoose.disconnect();
}

// 当直接运行此文件时(非被 require)执行 main
if (require.main === module) {
  main().catch((e) => {
    console.error('[seed] failed:', e);
    process.exit(1);
  });
}
