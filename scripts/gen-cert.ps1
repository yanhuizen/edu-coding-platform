#!/usr/bin/env pwsh
# 生成本地 HTTPS 自签证书(开发用)
# 需要安装 mkcert (https://github.com/FiloSottile/mkcert)
# 用法: .\scripts\gen-cert.ps1

$certDir = Join-Path (Split-Path -Parent $PSScriptRoot) "frontend\certs"
if (-not (Test-Path $certDir)) { New-Item -ItemType Directory -Force -Path $certDir | Out-Null }

Write-Host "🐘 生成本地 HTTPS 证书..." -ForegroundColor Green

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
  Write-Host "⚠️ mkcert 未安装" -ForegroundColor Yellow
  Write-Host "   安装方法: choco install mkcert  或  scoop install mkcert"
  Write-Host "   或者用 OpenSSL: openssl req -x509 -newkey rsa:4096 -nodes -keyout $certDir\key.pem -out $certDir\cert.pem -days 365 -subj '/CN=localhost'"
  exit 1
}

mkcert -install
mkcert -key-file "$certDir\key.pem" -cert-file "$certDir\cert.pem" localhost 127.0.0.1 ::1

Write-Host "✅ 证书已生成到 $certDir" -ForegroundColor Green
Write-Host "   下一步: 修改 frontend\vite.config.ts 启用 https 选项"
