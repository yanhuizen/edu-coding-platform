# 小象编程 · K12 Python 编程教学平台(MVP)

> 为 5-6 年级同学设计的浏览器端 Python 编程教学平台。教师建课,学生写代码,一键运行,即时反馈。

[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]() [![Vue](https://img.shields.io/badge/Vue-3.4-brightgreen)]() [![MongoDB](https://img.shields.io/badge/MongoDB-7-success)]() [![License](https://img.shields.io/badge/license-MIT-blue)]()

## ✨ 功能特性

- 🎨 **儿童友好 UI**:大字号、明亮配色、emoji 提示、避免专业术语
- ⚡ **浏览器端 Python**:用 Pyodide 直接在浏览器里运行 Python,无需后端执行
- ⌨️ **Monaco 代码编辑器**:VSCode 同款,语法高亮、自动缩进
- 📚 **课程 + 作业**:Markdown 课程内容,作业可自动判分或教师手动批改
- 👨‍🏫 **教师后台**:建课、编辑课时、新建作业、批改提交
- 🌐 **WebSocket**:为后续教师实时观察学生做扩展
- 🔐 **JWT 鉴权**:学生自由注册,教师需邀请码

## 🚀 快速开始

### 环境要求

- Node.js 20+
- MongoDB 7.x(本地或 Docker)
- npm / pnpm / yarn

### 国内用户加速说明

项目已预置国内镜像配置:

- **npm 包**:前后端均已配置 `.npmrc` 使用 npmmirror(淘宝 npm 镜像)
- **Pyodide**:默认使用 `cdn.npmmirror.com` 国内 CDN
- **Docker 镜像**:见 `docker-compose.yml` 注释,或配置 Docker 加速器

### 1. 启动 MongoDB

**方式 A: Docker (推荐)**

```bash
docker compose up -d mongo
```

> 国内镜像拉取失败? 请打开 `docker-compose.yml`,切换到其他镜像源(网易/百度/DaoCloud 等)。

**方式 B: 本地安装 MongoDB (无 Docker 备选)**

1. 前往 [MongoDB 官网](https://www.mongodb.com/try/download/community) 下载 MongoDB 7.x Community Server
2. 安装时选择 "Complete",勾选 "Install MongoDB as a Service"
3. 默认端口 `27017`,无需密码
4. 安装完成后服务会自动启动

### 2. 启动后端

```bash
cd backend
cp .env.example .env       # 第一次需要
npm install
npm run dev
```

后端运行在 `http://localhost:4000`,健康检查 `http://localhost:4000/api/health`。

### 3. 启动前端

```bash
cd frontend
cp .env.example .env       # 第一次需要
npm install
npm run dev
```

前端运行在 `http://localhost:5173`,已配置代理 `/api` → 后端。

### 4. 灌入示例数据(可选)

```bash
cd backend
npm run seed:demo
```

会创建:

- 教师账号:`teacher / 123456`(邀请码 `DEMO2026`)
- 学生账号:`student / 123456`
- 7 节示例课程(print / 变量 / 数字 / 输入 / 条件 / 循环 / 列表)

### 5. 一键启动

**Windows (推荐,无需改执行策略):**
```cmd
.\scripts\start-dev.bat
```

**Windows PowerShell:**
```powershell
# 如果提示"禁止运行脚本",先执行一次(仅当前用户有效):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后运行:
.\scripts\start-dev.ps1
```

**Linux / Mac:**
```bash
bash ./scripts/start-dev.sh
```

会同时打开 MongoDB、后端、前端 3 个新窗口。

## 🧑‍🎓 学生使用

1. 注册账号(选"我是学生",任意用户名 + 密码)
2. 进入"📚 课程" → 选一门课
3. 点"✏️ 开始挑战" → 写代码 → 点"▶️ 运行" → 看输出
4. 满意后点"📤 提交"
5. 去"👤 我的"查看提交记录和分数

## 👨‍🏫 教师使用

1. 注册时填"我是老师" + **邀请码**(默认 `DEMO2026`)
2. 进入"教师后台" → "➕ 新建课程"
3. 在课程编辑页:
   - 改标题、简介、emoji 封面
   - 添课时(Markdown 内容 + 示例代码)
   - 给课时添作业(可设预期输出自动判分)
4. 点"🚀 发布"后,学生才可见
5. 作业被学生提交后,进入"📊 提交"批改

## 📁 项目结构

```
edu-coding-platform/
├── frontend/                  # Vue3 + TS 前端
│   ├── src/
│   │   ├── views/             # 页面
│   │   ├── components/        # 通用组件 (CodeEditor, Console, FriendlyError)
│   │   ├── composables/       # usePyodide
│   │   ├── stores/            # Pinia
│   │   ├── router/
│   │   ├── api/               # axios 封装
│   │   ├── styles/            # SCSS
│   │   └── utils/             # pythonErrors 等
│   └── ...
├── backend/                   # Node.js + Express 后端
│   ├── src/
│   │   ├── routes/            # auth, courses, assignments, submissions, health
│   │   ├── models/            # Mongoose: User, Course, Assignment, Submission
│   │   ├── middleware/        # auth (JWT), errorHandler
│   │   ├── ws/                # WebSocket 服务
│   │   ├── config/            # env, mongoose
│   │   └── app.ts
│   ├── scripts/               # seed-courses, seed-demo
│   └── server.ts
├── docs/                      # 文档
├── scripts/                   # start-dev, gen-cert
├── docker-compose.yml
└── README.md
```

## 🔌 API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | 否 |
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/me` | 当前用户 | 是 |
| GET | `/api/courses` | 课程列表 | 是 |
| GET | `/api/courses/:id` | 课程详情 | 是 |
| POST | `/api/courses` | 新建课程 | teacher |
| PUT | `/api/courses/:id` | 更新课程 | teacher |
| POST | `/api/courses/:id/lessons` | 加课时 | teacher |
| GET | `/api/courses/:id/assignments` | 课程作业列表 | 是 |
| POST | `/api/assignments` | 新建作业 | teacher |
| PUT | `/api/assignments/:id` | 更新作业 | teacher |
| POST | `/api/submissions` | 提交作业 | student |
| GET | `/api/submissions/mine` | 我的提交 | student |
| GET | `/api/submissions/by-assignment/:id` | 作业提交列表 | teacher |
| POST | `/api/submissions/:id/grade` | 批改 | teacher |
| WS | `/ws/logs?token=...&room=...` | 实时日志 | JWT |

## ⚙️ 环境变量

后端 `backend/.env`:

| 变量 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `PORT` | 否 | 4000 | 后端端口 |
| `MONGODB_URI` | 是 | mongodb://localhost:27017/edu_coding | Mongo 连接 |
| `JWT_SECRET` | 是 | - | JWT 签名密钥(生产请改) |
| `JWT_EXPIRES_IN` | 否 | 7d | Token 有效期 |
| `TEACHER_INVITE_CODES` | 否 | DEMO2026,TEACH2026 | 教师邀请码(逗号分隔) |
| `CORS_ORIGIN` | 否 | http://localhost:5173 | 允许的跨域来源 |

## 🛠 常见问题

**Q: 登录报 500 错误 / 后端启动失败?**
A: 大概率是 MongoDB 没连上。检查:
1. MongoDB 服务是否启动? `docker ps` 看容器是否在运行
2. 端口 27017 是否被占用?
3. Docker 镜像拉取失败? 打开 `docker-compose.yml` 切换其他国内镜像源
4. 后端控制台会输出详细的连接失败原因和排查步骤

**Q: Pyodide 加载慢?**
A: 首次约 10-20MB,后续会走浏览器缓存。默认已使用国内 npmmirror CDN,如需切换可在 `frontend/.env` 设置 `VITE_PYODIDE_CDN=https://cdn.jsdelivr.net/pyodide/v`。生产环境建议把 Pyodide 静态资源部署到自有 CDN。

**Q: 学生在浏览器里写 `while True:` 死循环怎么办?**
A: MVP 限制 8 秒超时自动 kill,v0.2 会改用 Web Worker 更彻底地防止。

**Q: 想给老师加新邀请码?**
A: 修改 `backend/.env` 的 `TEACHER_INVITE_CODES`,多个用逗号分隔,重启后端生效。

**Q: 部署到生产?**
A: 前端 `npm run build` → `frontend/dist/` 走 nginx;后端 `npm run build && npm start` 跑在 4000;MongoDB 用 Atlas / 阿里云。详见 `docs/deployment.md`。

## 📋 开发路线图

- [x] v0.1 (MVP):Pyodide + Monaco + 课程作业
- [ ] v0.2:硬件连接(Web Serial + Arduino Uno + Konva 虚拟元件)
- [ ] v0.3:教师实时观察大屏、AI 助教
- [ ] v0.4:移动端适配
- [ ] v0.5:班级管理、成绩导出、i18n

## 📄 许可证

MIT
