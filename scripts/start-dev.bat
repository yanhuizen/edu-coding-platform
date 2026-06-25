@echo off
setlocal enabledelayedexpansion

title XiaoXiang Coding - Dev Environment

rem =========================================
rem  解析项目根目录
rem =========================================
set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%.."
pushd "%ROOT%"
set "ROOT=%CD%"
popd

rem =========================================
rem  显示标题
rem =========================================
echo.
echo ========================================
echo   XiaoXiang Coding - Dev Environment
echo ========================================
echo.
echo 项目目录: %ROOT%
echo.

rem =========================================
rem  Step 0: 检查 Node.js
rem =========================================
echo [检查] Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [错误] 未检测到 Node.js！
  echo.
  echo 请先安装 Node.js (推荐 18.x 或更高版本):
  echo   下载地址: https://nodejs.org/
  echo.
  echo 安装后请重新运行此脚本
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODE_VER=%%v"
echo        Node.js %NODE_VER%  OK
echo.

rem =========================================
rem  Step 0: 检查 npm
rem =========================================
echo [检查] npm...
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [错误] npm 不可用！
  echo.
  echo 请检查 Node.js 是否正确安装
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('npm --version') do set "NPM_VER=%%v"
echo        npm %NPM_VER%  OK
echo.

rem =========================================
rem  Step 1: 检查 MongoDB
rem =========================================
echo [1/3] 检查 MongoDB 连接...
call :check_mongo_port 27017
if errorlevel 1 (
  echo.
  echo [错误] 无法连接到 MongoDB (localhost:27017)
  echo.
  echo 请确保本地 MongoDB 服务已启动：
  echo.
  echo   方法1: 在「服务」中启动 MongoDB 服务
  echo   方法2: 命令行运行 mongod
  echo   方法3: 检查 MongoDB 是否已安装
  echo.
  echo 下载地址: https://www.mongodb.com/try/download/community
  echo.
  pause
  exit /b 1
)
echo        MongoDB 连接正常  OK
echo.

rem =========================================
rem  Step 2: 后端
rem =========================================
echo [2/3] 启动后端服务...

if not exist "%ROOT%\backend\node_modules" (
  echo        正在安装后端依赖，请稍候...
  pushd "%ROOT%\backend"
  call npm install
  if errorlevel 1 (
    popd
    echo.
    echo [错误] 后端依赖安装失败！
    echo.
    echo 请检查网络连接，或手动执行:
    echo   cd backend
    echo   npm install
    echo.
    pause
    exit /b 1
  )
  popd
)

start "XiaoXiang - Backend" /D "%ROOT%\backend" cmd /k "npm run dev"
if errorlevel 1 (
  echo.
  echo [错误] 启动后端失败！
  echo.
  pause
  exit /b 1
)
echo        后端服务启动中...
echo.

rem =========================================
rem  Step 3: 前端
rem =========================================
echo [3/3] 启动前端服务...

if not exist "%ROOT%\frontend\node_modules" (
  echo        正在安装前端依赖，请稍候...
  pushd "%ROOT%\frontend"
  call npm install
  if errorlevel 1 (
    popd
    echo.
    echo [错误] 前端依赖安装失败！
    echo.
    echo 请检查网络连接，或手动执行:
    echo   cd frontend
    echo   npm install
    echo.
    pause
    exit /b 1
  )
  popd
)

start "XiaoXiang - Frontend" /D "%ROOT%\frontend" cmd /k "npm run dev"
if errorlevel 1 (
  echo.
  echo [错误] 启动前端失败！
  echo.
  pause
  exit /b 1
)
echo        前端服务启动中...
echo.

rem =========================================
rem  启动完成
rem =========================================
rem 等待几秒让服务启动
ping 127.0.0.1 -n 4 >nul

echo ========================================
echo   ✅ 启动完成！
echo.
echo   前端地址: http://localhost:5173
echo   后端地址: http://localhost:4000
echo   MongoDB : localhost:27017
echo.
echo   教师邀请码: DEMO2026
echo.
echo   💡 此窗口即将自动关闭
echo      服务在前后端窗口中运行
echo ========================================
echo.

rem 显示 3 秒后自动退出
ping 127.0.0.1 -n 4 >nul
exit /b 0

rem =========================================
rem  子程序: 检查端口是否开放
rem =========================================
:check_mongo_port
setlocal
set "PORT=%~1"
set "HOST=localhost"

rem 方法1: 使用 netstat 检测
netstat -an | findstr ":%PORT% " | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  endlocal
  exit /b 0
)

rem 方法2: 使用 PowerShell TcpClient 检测
powershell -NoProfile -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('%HOST%', %PORT%); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  endlocal
  exit /b 0
)

endlocal
exit /b 1
