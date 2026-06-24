#!/usr/bin/env bash
# 一键启动开发环境(Linux/Mac)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🐘 启动小象编程开发环境..."

# 1. MongoDB
if command -v docker >/dev/null 2>&1; then
  echo "▶ 启动 MongoDB..."
  docker compose up -d mongo
else
  echo "⚠️ Docker 未安装,请手动启动 MongoDB 或修改 MONGODB_URI"
fi

# 2. 后端
if [ ! -d backend/node_modules ]; then
  echo "▶ 安装后端依赖..."
  (cd backend && npm install)
fi
echo "▶ 启动后端 (新终端)..."
(cd backend && npm run dev) &

# 3. 前端
if [ ! -d frontend/node_modules ]; then
  echo "▶ 安装前端依赖..."
  (cd frontend && npm install)
fi
echo "▶ 启动前端 (新终端)..."
(cd frontend && npm run dev) &

wait

echo ""
echo "✅ 已启动:"
echo "   - MongoDB  : localhost:27017"
echo "   - 后端 API : http://localhost:4000"
echo "   - 前端     : http://localhost:5173"
echo ""
echo "🇨🇳 国内镜像已配置:"
echo "   - npm 包    : npmmirror (前后端 .npmrc)"
echo "   - Pyodide   : cdn.npmmirror.com"
echo "   - Docker    : 请自行配置镜像加速器"
echo ""
echo "🎫 教师邀请码: DEMO2026 (可到 backend/.env 修改)"
