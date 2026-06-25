#!/usr/bin/env pwsh
# 一键启动开发环境
# 用法: .\scripts\start-dev.ps1

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "🐘 启动小象编程开发环境..." -ForegroundColor Green
Write-Host ""

# 检查 Node.js
Write-Host "🔍 检查 Node.js..." -ForegroundColor Cyan
try {
  $nodeVer = node --version
  Write-Host "   Node.js $nodeVer  ✓" -ForegroundColor Green
} catch {
  Write-Host "   ❌ 未检测到 Node.js，请先安装: https://nodejs.org/" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}

# 检查 npm
try {
  $npmVer = npm --version
  Write-Host "   npm $npmVer  ✓" -ForegroundColor Green
} catch {
  Write-Host "   ❌ npm 不可用" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}
Write-Host ""

# 1. 检查 MongoDB
Write-Host "[1/3] 检查 MongoDB 连接..." -ForegroundColor Cyan
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.Connect("localhost", 27017)
  $tcp.Close()
  Write-Host "   MongoDB 连接正常  ✓" -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "   ❌ 无法连接到 MongoDB (localhost:27017)" -ForegroundColor Red
  Write-Host ""
  Write-Host "   请确保本地 MongoDB 服务已启动：" -ForegroundColor Yellow
  Write-Host "     • 方法1: 服务管理器中启动 MongoDB 服务"
  Write-Host "     • 方法2: 命令行运行 mongod"
  Write-Host "     • 方法3: 检查 MongoDB 是否安装"
  Write-Host ""
  Read-Host "按回车退出"
  exit 1
}
Write-Host ""

# 2. 后端
Write-Host "[2/3] 启动后端服务..." -ForegroundColor Cyan
if (-not (Test-Path "$root\backend\node_modules")) {
  Write-Host "   正在安装后端依赖，请稍候..." -ForegroundColor Yellow
  Set-Location "$root\backend"
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 后端依赖安装失败" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
  }
  Set-Location $root
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"
Write-Host "   后端服务启动中..." -ForegroundColor Green
Write-Host ""

# 3. 前端
Write-Host "[3/3] 启动前端服务..." -ForegroundColor Cyan
if (-not (Test-Path "$root\frontend\node_modules")) {
  Write-Host "   正在安装前端依赖，请稍候..." -ForegroundColor Yellow
  Set-Location "$root\frontend"
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 前端依赖安装失败" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
  }
  Set-Location $root
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"
Write-Host "   前端服务启动中..." -ForegroundColor Green
Write-Host ""

# 等待几秒
Start-Sleep -Seconds 3

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ 启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "  前端地址: http://localhost:5173"
Write-Host "  后端地址: http://localhost:4000"
Write-Host "  MongoDB : localhost:27017"
Write-Host ""
Write-Host "  教师邀请码: DEMO2026" -ForegroundColor Yellow
Write-Host ""
Write-Host "  💡 提示: 关闭此窗口不会停止服务，"
Write-Host "         请在各自窗口中按 Ctrl+C 停止"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "按回车关闭此窗口（服务继续运行）"
