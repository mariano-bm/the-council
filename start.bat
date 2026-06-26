@echo off
echo ============================================
echo   THE COUNCIL - El Consejo
echo ============================================
echo.

echo Liberando puertos 3001 y 5174...
call npx --yes kill-port 3001 5174 >nul 2>&1

echo Arrancando backend en puerto 3001...
start "Council Backend" cmd /k "cd /d %~dp0server && node src/index.js"

timeout /t 3 /nobreak >nul

echo Arrancando frontend en puerto 5174...
start "Council Frontend" cmd /k "cd /d %~dp0client && npx vite --port 5174"

timeout /t 5 /nobreak >nul

echo Abriendo navegador...
start http://localhost:5174

echo.
echo ============================================
echo   LISTO!
echo   Frontend: http://localhost:5174
echo   Backend:  http://localhost:3001
echo   Overlay:  http://localhost:5174/overlay/brawlhalla/?api=http://localhost:3001/api/brawlhalla
echo   Torneos:  http://localhost:5174/torneos
echo ============================================
echo Para parar: cerra las 2 ventanas de cmd
pause
