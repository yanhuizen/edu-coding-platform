@echo off
chcp 65001 >nul
title XiaoXiang Coding - Dev Environment

echo.
echo ========================================
echo   XiaoXiang Coding - Dev Environment
echo ========================================
echo.

set "ROOT=%~dp0.."
cd /d "%ROOT%"

rem ---- 检查 Node.js ----
echo [检查] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js
  echo        下载地址: https://nodejs.org/
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODE_VER=%%v"
echo        Node.js %NODE_VER%  ✓
echo.

rem ---- 检查 npm ----
echo [检查] npm...
npm --version >nul 2>&1
if errorlevel 1 (
  echo [错误] npm 不可用
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('npm --version') do set "NPM_VER=%%v"
echo        npm %NPM_VER%  ✓
echo.

rem ---- Step 1: 检查 MongoDB ----
echo [1/3] 检查 MongoDB 连接...
call :check_mongo
if errorlevel 1 (
  echo.
  echo [错误] 无法连接到 MongoDB (localhost:27017)
  echo.
  echo 请确保本地 MongoDB 服务已启动：
  echo   - 方法1: 服务管理器中启动 MongoDB 服务
  echo   - 方法2: 命令行运行 mongod
  echo   - 方法3: 检查 MongoDB 是否安装
  echo.
  pause
  exit /b 1
)
echo        MongoDB 连接正常  ✓
echo.

rem ---- Step 2: 安装后端依赖（如果需要）----
echo [2/3] 启动后端服务...
if not exist "backend\node_modules" (
  echo        正在安装后端依赖，请稍候...
  cd /d "%ROOT%\backend"
  call npm install
  if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
  )
  cd /d "%ROOT%"
)

rem 启动后端（新窗口）
start "XiaoXiang - Backend" cmd /k "cd /d "%ROOT%\backend" && npm run dev"
echo        后端服务启动中...
echo.

rem ---- Step 3: 安装前端依赖（如果需要）----
echo [3/3] 启动前端服务...
if not exist "frontend\node_modules" (
  echo        正在安装前端依赖，请稍候...
  cd /d "%ROOT%\frontend"
  call npm install
  if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
  )
  cd /d "%ROOT%"
)

rem 启动前端（新窗口）
start "XiaoXiang - Frontend" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"
echo        前端服务启动中...
echo.

rem 等待几秒让服务启动
timeout /t 3 /nobreak >nul

echo ========================================
echo   启动完成！
echo.
echo   前端地址: http://localhost:5173
echo   后端地址: http://localhost:4000
echo   MongoDB : localhost:27017
echo.
echo   教师邀请码: DEMO2026
echo.
echo   提示: 关闭此窗口不会停止服务，
echo         请在各自窗口中按 Ctrl+C 停止
echo ========================================
echo.
pause
goto :eof

rem =========================================
rem  检查 MongoDB 端口是否开放
rem =========================================
:check_mongo
setlocal
set "MONGO_PORT=27017"
set "MONGO_HOST=localhost"

rem 使用 PowerShell 检测端口
powershell -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('%MONGO_HOST%', %MONGO_PORT%); $t.Close(); exit 0 } catch { exit 1 }"
if errorlevel 1 (
  endlocal
  exit /b 1
)

endlocal
exit /b 0
