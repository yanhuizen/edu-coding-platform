#!/usr/bin/env bash
# 一键启动开发环境(Linux/Mac) - 使用本地 MongoDB
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🐘 启动小象编程开发环境..."

# 1. 检查 MongoDB
echo "▶ 检查 MongoDB..."
mongoReady=false
for i in {1..6}; do
  if mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" 2>/dev/null | grep -q "1"; then
    mongoReady=true
    break
  fi
  echo -n "."
  sleep 2
done

if [ "$mongoReady" = false ]; then
  echo ""
  echo "⚠️ MongoDB 未检测到!"
  echo "   请先安装并启动 MongoDB:"
  echo "   1. macOS: brew install mongodb-community && brew services start mongodb-community"
  echo "   2. Linux: sudo systemctl start mongod"
  echo "   3. 或修改 backend/.env 中的 MONGODB_URI"
  exit 1
fi

echo ""
echo "✅ MongoDB 已就绪 (localhost:27017)"

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
echo "   - Pyodide   : 后端代理 + 多 CDN 源"
echo ""
echo "🎫 教师邀请码: DEMO2026 (可到 backend/.env 修改)"
