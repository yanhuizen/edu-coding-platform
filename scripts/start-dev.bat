@echo off
title XiaoXiang Coding - Dev Environment

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
set "ROOT=%CD%"
cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo   XiaoXiang Coding - Dev Environment
echo ========================================
echo.
echo Project: %ROOT%
echo.

echo [Check] Node.js...
where node >nul
if errorlevel 1 goto error_node
echo        Node.js found  OK
echo.

echo [Check] npm...
where npm >nul
if errorlevel 1 goto error_npm
echo        npm found  OK
echo.

echo [1/3] Checking MongoDB...
netstat -an | findstr ":27017 " | findstr LISTENING >nul
if errorlevel 1 goto error_mongo
echo        MongoDB is running  OK
echo.

echo [2/3] Starting backend...
if exist "%ROOT%\backend\node_modules" goto start_backend
echo        Installing backend dependencies...
cd /d "%ROOT%\backend"
call npm install
if errorlevel 1 goto error_backend_install
cd /d "%SCRIPT_DIR%"

:start_backend
start "XiaoXiang - Backend" /D "%ROOT%\backend" cmd /k "npm run dev"
if errorlevel 1 goto error_backend_start
echo        Backend starting...
echo.

echo [3/3] Starting frontend...
if exist "%ROOT%\frontend\node_modules" goto start_frontend
echo        Installing frontend dependencies...
cd /d "%ROOT%\frontend"
call npm install
if errorlevel 1 goto error_frontend_install
cd /d "%SCRIPT_DIR%"

:start_frontend
start "XiaoXiang - Frontend" /D "%ROOT%\frontend" cmd /k "npm run dev"
if errorlevel 1 goto error_frontend_start
echo        Frontend starting...
echo.

rem Wait 3 seconds
ping 127.0.0.1 -n 4 >nul

echo ========================================
echo   Startup complete!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:4000
echo   MongoDB  : localhost:27017
echo.
echo   Teacher invite code: DEMO2026
echo ========================================
echo.

ping 127.0.0.1 -n 4 >nul
exit /b 0

:error_node
echo.
echo [ERROR] Node.js not found!
echo.
echo Please install Node.js (v18+)
echo Download: https://nodejs.org/
echo.
pause
exit /b 1

:error_npm
echo.
echo [ERROR] npm not found!
echo.
echo Please check Node.js installation.
echo.
pause
exit /b 1

:error_mongo
echo.
echo [ERROR] Cannot connect to MongoDB (port 27017)
echo.
echo Make sure MongoDB is running:
echo   - Start MongoDB service from Services
echo   - Or run: mongod
echo.
echo Download: https://www.mongodb.com/try/download/community
echo.
pause
exit /b 1

:error_backend_install
cd /d "%SCRIPT_DIR%"
echo.
echo [ERROR] Failed to install backend dependencies
echo.
echo Check network connection, or run manually:
echo   cd backend
echo   npm install
echo.
pause
exit /b 1

:error_backend_start
echo.
echo [ERROR] Failed to start backend
echo.
pause
exit /b 1

:error_frontend_install
cd /d "%SCRIPT_DIR%"
echo.
echo [ERROR] Failed to install frontend dependencies
echo.
echo Check network connection, or run manually:
echo   cd frontend
echo   npm install
echo.
pause
exit /b 1

:error_frontend_start
echo.
echo [ERROR] Failed to start frontend
echo.
pause
exit /b 1
