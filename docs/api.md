# API 文档

Base URL: `http://localhost:4000/api`

所有请求/响应均为 JSON,鉴权使用 `Authorization: Bearer <token>` Header。

## 通用响应

成功:
```json
{ "courses": [...] }
```

失败:
```json
{ "error": "code", "message": "人类可读的中文提示" }
```

## Auth

### POST `/auth/register`

注册账号(学生无邀请码,教师需邀请码)。

请求:
```json
{
  "username": "xiaoming",
  "password": "123456",
  "displayName": "小明",
  "avatarEmoji": "🐼",
  "inviteCode": "DEMO2026"   // 教师必填,学生留空
}
```

响应 201:
```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "user": { "id": "...", "username": "xiaoming", "role": "student", ... }
}
```

### POST `/auth/login`

请求:
```json
{ "username": "xiaoming", "password": "123456" }
```

响应 200: 同 register

### GET `/auth/me`

响应:
```json
{ "user": { "id": "...", ... } }
```

## Courses

### GET `/courses`

- 学生:返回 `published: true` 的课程
- 教师:返回自己创建的课程

### GET `/courses/:id`

课程详情(含 lessons 内嵌)。

### POST `/courses` (teacher)

请求:
```json
{ "title": "Python 入门", "description": "...", "coverEmoji": "🐘" }
```

### PUT `/courses/:id` (teacher)

可更新 `title / description / coverEmoji / order / published`。

### POST `/courses/:id/lessons` (teacher)

请求:
```json
{
  "title": "第 1 课",
  "contentMd": "# 你好",
  "codeExample": "print('hi')",
  "order": 1
}
```

### PUT `/courses/:id/lessons/:lessonId` (teacher)

### DELETE `/courses/:id/lessons/:lessonId` (teacher)

### GET `/courses/:id/assignments`

返回该课程下的所有作业。

## Assignments

### GET `/assignments/:id`

### POST `/assignments` (teacher)

```json
{
  "courseId": "...",
  "lessonId": "...",          // 可选
  "title": "作业 1",
  "prompt": "...",
  "starterCode": "...",
  "expectedOutput": "...",     // 可选,填了会自动判分
  "totalScore": 100
}
```

### PUT `/assignments/:id` (teacher)
### DELETE `/assignments/:id` (teacher)

## Submissions

### POST `/submissions` (student)

```json
{
  "assignmentId": "...",
  "code": "print('hi')",
  "output": "hi"               // 浏览器端运行后拿到的输出
}
```

若作业有 `expectedOutput`,后端会再次比对并设置 `status`(`passed` / `failed`)。

### GET `/submissions/mine` (student)

返回当前学生最近 100 条提交(关联作业基本信息)。

### GET `/submissions/by-assignment/:assignmentId` (teacher)

返回该作业所有学生的提交(关联学生基本信息)。

### POST `/submissions/:id/grade` (teacher)

```json
{ "score": 95, "comment": "再仔细一点缩进~" }
```

## WebSocket `/ws/logs`

URL: `ws://host:4000/ws/logs?token=<JWT>&room=<roomId>`

### 客户端消息

```json
{ "type": "log", "data": "hello" }
{ "type": "switch-room", "room": "student-123" }
```

### 服务端消息

```json
{ "type": "hello", "userId": "...", "role": "student", "room": "..." }
{ "type": "log", "from": "username", "role": "student", "data": "...", "ts": 1234 }
{ "type": "room-switched", "room": "..." }
```

## 错误码

| HTTP | error code | 含义 |
|------|------------|------|
| 400 | validation_error | 请求参数不合法 |
| 400 | invalid_invite | 邀请码错误 |
| 401 | unauthorized | 未登录或 token 失效 |
| 403 | forbidden | 权限不足 |
| 404 | not_found | 资源不存在 |
| 409 | duplicate | 重复(用户名已存在) |
| 500 | internal_error | 服务器异常 |
