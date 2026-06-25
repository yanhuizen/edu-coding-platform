# Start dev environment with local MongoDB
# Usage: .\scripts\start-dev.ps1

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[*] Starting XiaoXiang Coding dev environment..." -ForegroundColor Green

# 1. Check MongoDB port (no mongosh dependency)
$scriptDir = Split-Path -Parent $PSCommandPath
$checkScript = Join-Path $scriptDir "check-mongo.ps1"

Write-Host "[>] Checking MongoDB (localhost:27017)..." -ForegroundColor Cyan
$mongoReady = $false
for ($i = 1; $i -le 6; $i++) {
    $output = powershell -NoProfile -ExecutionPolicy Bypass -File $checkScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        $mongoReady = $true
        break
    }
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 2
}

if (-not $mongoReady) {
    Write-Host ""
    Write-Host "[!] MongoDB port 27017 not responding!" -ForegroundColor Red
    Write-Host "    Please check:" -ForegroundColor Yellow
    Write-Host "    1. MongoDB service is running (check services.msc)" -ForegroundColor Yellow
    Write-Host "    2. Listening on port 27017 (check mongod.conf)" -ForegroundColor Yellow
    Write-Host "    3. Or update MONGODB_URI in backend/.env" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[OK] MongoDB port 27017 is ready" -ForegroundColor Green

# 2. Backend
Write-Host "[>] Starting backend (new window)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

# 3. Frontend
Write-Host "[>] Starting frontend (new window)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

Write-Host ""
Write-Host "[OK] Started:" -ForegroundColor Green
Write-Host "    - MongoDB  : localhost:27017"
Write-Host "    - Backend  : http://localhost:4000"
Write-Host "    - Frontend : http://localhost:5173"
Write-Host ""
Write-Host "[i] China mirrors configured:" -ForegroundColor Cyan
Write-Host "    - npm packages : npmmirror (see .npmrc)"
Write-Host "    - Pyodide      : backend proxy + multiple CDN sources"
Write-Host ""
Write-Host "[i] Teacher invite code: DEMO2026 (edit in backend/.env)" -ForegroundColor Yellow
