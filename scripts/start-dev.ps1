#!/usr/bin/env pwsh
# 一键启动开发环境
# 用法: .\scripts\start-dev.ps1

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "🐘 启动小象编程开发环境..." -ForegroundColor Green

# 1. 启动 MongoDB
if (-not (Get-Process -Name "docker" -ErrorAction SilentlyContinue)) {
  Write-Host "⚠️ Docker 没运行,请先启动 Docker Desktop" -ForegroundColor Yellow
} else {
  Write-Host "▶ 启动 MongoDB..." -ForegroundColor Cyan
  docker compose up -d mongo
}

# 2. 后端
Write-Host "▶ 启动后端 (新窗口)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

# 3. 前端
Write-Host "▶ 启动前端 (新窗口)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

Write-Host ""
Write-Host "✅ 已启动:" -ForegroundColor Green
Write-Host "   - MongoDB  : localhost:27017"
Write-Host "   - 后端 API : http://localhost:4000"
Write-Host "   - 前端     : http://localhost:5173"
Write-Host ""
Write-Host "🇨🇳 国内镜像已配置:" -ForegroundColor Cyan
Write-Host "   - npm 包    : npmmirror (前后端 .npmrc)"
Write-Host "   - Pyodide   : cdn.npmmirror.com"
Write-Host "   - Docker    : 请自行配置镜像加速器"
Write-Host ""
Write-Host "🎫 教师邀请码: DEMO2026 (可到 backend/.env 修改)" -ForegroundColor Yellow
