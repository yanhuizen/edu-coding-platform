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

rem ---- Step 1: MongoDB ----
echo [1/3] Starting MongoDB...
docker compose up -d mongo
if errorlevel 1 (
  echo.
  echo [WARN] MongoDB 启动失败! 请检查 Docker 是否运行
  echo        或手动启动本地 MongoDB
  echo.
) else (
  rem wait for mongo to be ready
  echo Waiting for MongoDB to be ready...
  call :wait_mongo
)
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

:wait_mongo
  setlocal
  for /l %%i in (1,1,12) do (
    docker compose exec -T mongo mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >nul 2>&1
    if not errorlevel 1 (
      echo MongoDB is ready!
      goto :eof
    )
    <nul set /p "=."
    timeout /t 2 /nobreak >nul
  )
  echo.
  echo [WARN] MongoDB may not be ready yet, please wait...
  endlocal
goto :eof
