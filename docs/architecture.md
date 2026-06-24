# 架构说明

## 总体架构

```
┌──────────────────┐         ┌──────────────────┐
│   浏览器 (学生)   │  HTTPS  │   浏览器 (教师)   │
│  Vue3 + Monaco   │  WSS    │  Vue3 + Monaco   │
│  Pyodide (WASM)  │◄───────►│                  │
└────────┬─────────┘         └────────┬─────────┘
         │ HTTP/WS                    │ HTTP/WS
         ▼                            ▼
┌─────────────────────────────────────────────┐
│       Nginx (反代 + 静态资源)                │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│   Node.js + Express + TypeScript             │
│  - REST API (/api/*)                        │
│  - WebSocket (/ws/logs)                     │
│  - JWT 鉴权 + 角色控制                       │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│   MongoDB 7                                 │
│  - users, courses, assignments, submissions │
└─────────────────────────────────────────────┘
```

## 数据流(学生提交作业)

1. 学生在浏览器写代码 → 点击"▶️ 运行"
2. 前端调用 `usePyodide().runCode(code)`
3. Pyodide(WASM)在浏览器本地执行,捕获 stdout/stderr
4. 输出实时推入 `Console` 组件
5. 若运行成功且输出与 `expectedOutput` 一致,提示"可以通过"
6. 学生点击"📤 提交" → 前端 `POST /api/submissions`
7. 后端:再次比对(可关掉) → 写入 MongoDB
8. 教师后台"📊 提交"页面 → 看到新提交 → 批改
9. 批改结果 `POST /api/submissions/:id/grade` → 写库
10. 学生"👤 我的"页面看到分数

## 模块划分

### 前端

| 模块 | 职责 |
|------|------|
| `views/Login.vue` `Register.vue` | 鉴权 |
| `views/Courses.vue` `CourseDetail.vue` | 学生浏览课程 |
| `views/Editor.vue` | 学生写代码、运行、提交(核心) |
| `views/Profile.vue` | 学生查看自己提交 |
| `views/teacher/Courses.vue` | 教师管理课程列表 |
| `views/teacher/CourseEdit.vue` | 教师编辑课程/课时/作业 |
| `views/teacher/Submissions.vue` | 教师批改 |
| `components/CodeEditor.vue` | Monaco 封装 |
| `components/Console.vue` | 输出控制台 |
| `components/FriendlyError.vue` | 中文友好错误提示 |
| `composables/usePyodide.ts` | Pyodide 单例 + 执行 |
| `utils/pythonErrors.ts` | Python 错误 → 中文翻译表 |
| `stores/auth.ts` `stores/courses.ts` | Pinia 状态 |
| `api/*.ts` | axios 封装 + 拦截器 |

### 后端

| 模块 | 职责 |
|------|------|
| `routes/auth.ts` | 注册、登录、me |
| `routes/courses.ts` | 课程 + 课时 CRUD |
| `routes/assignments.ts` | 作业 CRUD |
| `routes/submissions.ts` | 提交 + 自动判分 + 批改 |
| `routes/health.ts` | 健康检查 |
| `middleware/auth.ts` | JWT 解析 + requireRole |
| `middleware/errorHandler.ts` | 统一错误响应 |
| `ws/logs.ts` | WebSocket 服务(房间订阅) |
| `models/*.ts` | Mongoose Schema |

## 关键决策

1. **Python 运行时放浏览器(Pydodide)**:避免后端进程隔离、并发限制、资源消耗。学生体验更顺滑,冷启动延迟只在首次进编辑器。
2. **课程数据存 MongoDB 文档型**:课时嵌入课程,免去 join;提交 / 作业 / 学生各自分表,便于查询。
3. **作业自动判分只做字符串精确比对(忽略首尾空白)**:适合 MVP 的简单场景;复杂场景(数值范围、表格输出)v0.2+ 再扩展。
4. **教师邀请码从 env 读**:简化权限管理;后续做管理界面。
5. **WebSocket 仅做轻量推送**:MVP 阶段不强制;教师实时观察留到 v0.2+。

## 安全考量

- 密码 bcrypt 哈希(10 轮)
- JWT 签名密钥(env 配置,生产必须改)
- CORS 白名单
- 角色权限(学生/教师)路由层校验
- 教师只能改自己的课程和作业
- 学生只能看自己提交
- WebSocket JWT 校验 + 房间隔离(基础)

## 后续扩展

- v0.2:Web Serial 硬件连接(Arduino)+ Konva 虚拟元件
- v0.3:Web Worker + 超时 kill 防死循环
- v0.4:执行结果结构化判分(支持数值范围、列表匹配)
- v0.5:教师实时观察大屏(订阅某学生房间,WebSocket 推送代码片段)
