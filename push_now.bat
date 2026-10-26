@echo off
title Manual Push to GitHub
cd /d "%~dp0"
set PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%

echo ==========================================
echo       Manual Push to GitHub (main)
echo ==========================================

git status
echo.
set /p msg="Enter commit message (Press Enter for default): "
if "%msg%"=="" set msg=Update %DATE% %TIME%

git add -A
git commit -m "%msg%"
git push origin main

echo.
echo Changes pushed successfully!
pause
