#!/usr/bin/env pwsh
# 一键启动开发环境（使用本地 MongoDB）
# 用法: .\scripts\start-dev.ps1

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "🐘 启动小象编程开发环境..." -ForegroundColor Green

# 1. 检查 MongoDB
Write-Host "▶ 检查 MongoDB..." -ForegroundColor Cyan
$mongoReady = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $result = mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" 2>$null
        if ($result -eq "1") {
            $mongoReady = $true
            break
        }
    } catch {
        # ignore
    }
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 2
}

if (-not $mongoReady) {
    Write-Host ""
    Write-Host "⚠️ MongoDB 未检测到!" -ForegroundColor Red
    Write-Host "   请先安装并启动 MongoDB:" -ForegroundColor Yellow
    Write-Host "   1. 下载: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "   2. 安装后启动 MongoDB 服务" -ForegroundColor Yellow
    Write-Host "   3. 或修改 backend/.env 中的 MONGODB_URI" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ MongoDB 已就绪 (localhost:27017)" -ForegroundColor Green

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
Write-Host "   - Pyodide   : 后端代理 + 多 CDN 源"
Write-Host ""
Write-Host "🎫 教师邀请码: DEMO2026 (可到 backend/.env 修改)" -ForegroundColor Yellow
