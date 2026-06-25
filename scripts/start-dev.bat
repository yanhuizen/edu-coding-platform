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

rem ---- Step 1: Check MongoDB port ----
echo [1/3] Checking MongoDB (localhost:27017)...
call :check_mongo
if errorlevel 1 (
  echo.
  echo [WARN] MongoDB port 27017 not responding!
  echo        Please check:
  echo        1. MongoDB service is running (check services.msc)
  echo        2. Listening on port 27017 (check mongod.conf)
  echo        3. Or update MONGODB_URI in backend/.env
  echo.
  pause
  exit /b 1
)
echo MongoDB port 27017 is ready!
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
echo   Backend and Frontend are starting in new windows...
echo   Teacher invite code: DEMO2026
echo ========================================
echo.

rem No pause - Start-Process creates independent windows that persist
goto :eof

:check_mongo
  setlocal
  for /l %%i in (1,1,6) do (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-mongo.ps1" >nul 2>&1
    if not errorlevel 1 (
      endlocal
      exit /b 0
    )
    <nul set /p "=."
    timeout /t 2 /nobreak >nul
  )
  endlocal
  exit /b 1
