@echo off
setlocal

title XiaoXiang Coding - Dev Environment

rem =========================================
rem  Resolve project root path
rem =========================================
set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%.."
pushd "%ROOT%"
set "ROOT=%CD%"
popd

echo.
echo ========================================
echo   XiaoXiang Coding - Dev Environment
echo ========================================
echo.
echo Project: %ROOT%
echo.

rem =========================================
rem  Step 0: Check Node.js
rem =========================================
echo [Check] Node.js...
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js not found!
  echo.
  echo Please install Node.js (v18+ recommended):
  echo   https://nodejs.org/
  echo.
  echo Then run this script again.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODE_VER=%%v"
echo        Node.js %NODE_VER%  OK
echo.

rem =========================================
rem  Step 0: Check npm
rem =========================================
echo [Check] npm...
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] npm not found!
  echo.
  echo Please check your Node.js installation.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('npm --version') do set "NPM_VER=%%v"
echo        npm %NPM_VER%  OK
echo.

rem =========================================
rem  Step 1: Check MongoDB
rem =========================================
echo [1/3] Checking MongoDB...
call :check_port 27017
if errorlevel 1 (
  echo.
  echo [ERROR] Cannot connect to MongoDB (localhost:27017)
  echo.
  echo Make sure MongoDB is running:
  echo   - Start MongoDB service from Services
  echo   - Or run "mongod" in command line
  echo   - Download: https://www.mongodb.com/try/download/community
  echo.
  pause
  exit /b 1
)
echo        MongoDB is running  OK
echo.

rem =========================================
rem  Step 2: Backend
rem =========================================
echo [2/3] Starting backend...

if not exist "%ROOT%\backend\node_modules" (
  echo        Installing backend dependencies...
  pushd "%ROOT%\backend"
  call npm install
  if errorlevel 1 (
    popd
    echo.
    echo [ERROR] Failed to install backend dependencies!
    echo.
    echo Check your network connection, or run manually:
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
  echo [ERROR] Failed to start backend!
  echo.
  pause
  exit /b 1
)
echo        Backend starting...
echo.

rem =========================================
rem  Step 3: Frontend
rem =========================================
echo [3/3] Starting frontend...

if not exist "%ROOT%\frontend\node_modules" (
  echo        Installing frontend dependencies...
  pushd "%ROOT%\frontend"
  call npm install
  if errorlevel 1 (
    popd
    echo.
    echo [ERROR] Failed to install frontend dependencies!
    echo.
    echo Check your network connection, or run manually:
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
  echo [ERROR] Failed to start frontend!
  echo.
  pause
  exit /b 1
)
echo        Frontend starting...
echo.

rem =========================================
rem  Startup complete
rem =========================================
rem Wait for services to start
ping 127.0.0.1 -n 4 >nul

echo ========================================
echo   Startup complete!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:4000
echo   MongoDB  : localhost:27017
echo.
echo   Teacher invite code: DEMO2026
echo.
echo   This window will close automatically.
echo   Services run in separate windows.
echo ========================================
echo.

rem Wait 3 seconds then exit
ping 127.0.0.1 -n 4 >nul
exit /b 0

rem =========================================
rem  Subroutine: check if a port is open
rem =========================================
:check_port
setlocal
set "PORT=%~1"

rem Method 1: netstat
netstat -an | findstr ":%PORT% " | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  endlocal
  exit /b 0
)

rem Method 2: PowerShell TcpClient
powershell -NoProfile -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('localhost', %PORT%); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  endlocal
  exit /b 0
)

endlocal
exit /b 1
