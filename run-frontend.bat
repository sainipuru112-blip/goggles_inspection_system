@echo off
setlocal enabledelayedexpansion
title Hypervise - Frontend

:: ── Find Node ─────────────────────────────────────────────────
set NODE=
set NPM_CLI=

for %%n in (
    "C:\Program Files\nodejs\node.exe"
    "C:\Program Files (x86)\nodejs\node.exe"
) do ( if exist %%n set NODE=%%~n )
where node >nul 2>&1 && if "!NODE!"=="" set NODE=node

for %%m in (
    "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"
    "C:\Program Files (x86)\nodejs\node_modules\npm\bin\npm-cli.js"
) do ( if exist %%m set NPM_CLI=%%~m )

if "!NODE!"=="" (
    echo [ERROR] Node.js not found. Run setup.bat first.
    pause & exit /b 1
)

echo Starting Hypervise Frontend on http://localhost:5173 ...
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0frontend"
if not "!NPM_CLI!"=="" (
    "!NODE!" "!NPM_CLI!" run dev
) else (
    npm run dev
)
pause
