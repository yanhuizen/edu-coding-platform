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

rem ---- Step 1: Check MongoDB ----
echo [1/3] Checking MongoDB...
call :check_mongo
if errorlevel 1 (
  echo.
  echo [WARN] MongoDB 未检测到! 请先安装并启动 MongoDB
  echo        1. 下载安装: https://www.mongodb.com/try/download/community
  echo        2. 启动 MongoDB 服务
  echo        3. 或修改 backend/.env 中的 MONGODB_URI
  echo.
  pause
  exit /b 1
)
echo MongoDB is ready! (localhost:27017)
echo.

rem ---- Step 2: Backend ----
echo [2/3] Starting backend (new window)...
start "XiaoXiang - Backend" cmd /k "cd /d ""%ROOT%\backend"" && if not exist node_modules ( npm install ) && npm run dev"
echo.

rem ---- Step 3: Frontend ----
echo [3/3] Starting frontend (new window)...
start "XiaoXiang - Frontend" cmd /k "cd /d ""%ROOT%\frontend"" && if not exist node_modules ( npm install ) && npm run dev"
echo.

echo ========================================
echo   Started:
echo      - MongoDB  : localhost:27017
echo      - Backend  : http://localhost:4000
echo      - Frontend : http://localhost:5173
echo.
echo   Teacher invite code: DEMO2026
echo ========================================
echo.
pause
goto :eof

:check_mongo
  setlocal
  for /l %%i in (1,1,6) do (
    mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >nul 2>&1
    if not errorlevel 1 (
      endlocal
      exit /b 0
    )
    <nul set /p "=."
    timeout /t 2 /nobreak >nul
  )
  endlocal
  exit /b 1
