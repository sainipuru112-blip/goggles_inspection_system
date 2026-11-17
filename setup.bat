@echo off
setlocal enabledelayedexpansion
title  AI Vision Platform - Setup

echo.
echo ============================================================
echo    AI Vision Platform - Automatic Setup
echo ============================================================
echo.

:: ── Step 1: Find Python ─────────────────────────────────────
echo [1/5] Checking for Python...

set PYTHON=
for %%p in (
    "%LOCALAPPDATA%\Python\pythoncore-3.15-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.13-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.12-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.11-64\python.exe"
) do (
    if exist %%p (
        set PYTHON=%%~p
        goto :found_python
    )
)

:: Fallback to PATH python
where python >nul 2>&1 && set PYTHON=python
where python3 >nul 2>&1 && set PYTHON=python3

:found_python
if "!PYTHON!"=="" (
    echo [ERROR] Python not found!
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo [OK] Python found: !PYTHON!
"!PYTHON!" --version
echo.

:: ── Step 2: Install Python dependencies ─────────────────────
echo [2/5] Installing Python backend dependencies...
echo.
"!PYTHON!" -m pip install --upgrade pip
"!PYTHON!" -m pip install -r "%~dp0backend\requirements.txt"

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install Python dependencies.
    echo Check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Python dependencies installed.
echo.

:: ── Step 3: Find Node.js ─────────────────────────────────────
echo [3/5] Checking for Node.js...

set NODE=
set NPM_CLI=

:: Check common install locations
for %%n in (
    "C:\Program Files\nodejs\node.exe"
    "C:\Program Files (x86)\nodejs\node.exe"
) do (
    if exist %%n (
        set NODE=%%~n
        goto :found_node
    )
)

:: Check PATH
where node >nul 2>&1 && set NODE=node

:found_node
if "!NODE!"=="" (
    echo [WARN] Node.js not found. Attempting to install via winget...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo.
        echo [ERROR] Could not auto-install Node.js.
        echo Please install it manually from: https://nodejs.org  (LTS version^)
        echo Then re-run this setup script.
        pause
        exit /b 1
    )
    set NODE=C:\Program Files\nodejs\node.exe
    echo [OK] Node.js installed via winget.
) else (
    echo [OK] Node.js found: !NODE!
    "!NODE!" --version
)

:: Locate npm-cli.js
set NPM_CLI=
for %%m in (
    "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"
    "C:\Program Files (x86)\nodejs\node_modules\npm\bin\npm-cli.js"
) do (
    if exist %%m set NPM_CLI=%%~m
)

echo.

:: ── Step 4: Fix PowerShell execution policy ──────────────────
echo [4/5] Fixing PowerShell execution policy for npm...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" >nul 2>&1
echo [OK] Execution policy set to RemoteSigned.
echo.

:: ── Step 5: Install frontend npm packages ────────────────────
echo [5/5] Installing frontend dependencies (npm install)...
echo.

if not "!NPM_CLI!"=="" (
    "!NODE!" "!NPM_CLI!" install --prefix "%~dp0frontend"
) else (
    cd /d "%~dp0frontend"
    npm install
)

if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.
echo [OK] Frontend dependencies installed.

:: ── Done ─────────────────────────────────────────────────────
echo.
echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo   To start the application, run:  start-app.bat
echo   Or manually:
echo     Terminal 1 (Backend):  run-backend.bat
echo     Terminal 2 (Frontend): run-frontend.bat
echo.
pause
