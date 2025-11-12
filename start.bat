@echo off
chcp 65001 >nul
title Minesweeper Server
cls
echo ╔════════════════════════════════════════╗
echo ║     💣 Minesweeper Server 💣          ║
echo ╚════════════════════════════════════════╝
echo.
echo [*] Запуск сервера на http://localhost:8000
echo [*] Браузер откроется автоматически
echo [!] Для остановки нажми Ctrl+C
echo.
echo ────────────────────────────────────────
echo.

start http://localhost:8000

python -m http.server 8000

pause

