@echo off
setlocal enabledelayedexpansion
title Hypervise - Backend

:: ── Find Python ───────────────────────────────────────────────
set PYTHON=
for %%p in (
    "%LOCALAPPDATA%\Python\pythoncore-3.15-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.13-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.12-64\python.exe"
    "%LOCALAPPDATA%\Python\pythoncore-3.11-64\python.exe"
) do (
    if exist %%p ( set PYTHON=%%~p & goto :start )
)
where python >nul 2>&1 && set PYTHON=python

:start
if "!PYTHON!"=="" (
    echo [ERROR] Python not found. Run setup.bat first.
    pause & exit /b 1
)

echo Starting Hypervise Backend on http://localhost:8000 ...
echo API Docs: http://localhost:8000/docs
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0backend"
"!PYTHON!" -m uvicorn app:app --host 0.0.0.0 --port 8000
pause
