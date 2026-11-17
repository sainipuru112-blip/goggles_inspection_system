@echo off
title Hypervise AI Vision Platform
echo.
echo  Starting Hypervise AI Vision Platform...
echo  Backend  → http://localhost:8000
echo  Frontend → http://localhost:5173
echo.
echo  Close either window to stop that server.
echo.

start "Hypervise Backend" "%~dp0run-backend.bat"
timeout /t 3 /nobreak >nul
start "Hypervise Frontend" "%~dp0run-frontend.bat"
timeout /t 4 /nobreak >nul

start "" "http://localhost:5173"
