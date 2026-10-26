@echo off
title SRMPromptWar Auto-Push Watcher
cd /d "%~dp0"
echo Starting Git auto-push watcher...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto_push.ps1"
pause
