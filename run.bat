@echo off
setlocal

echo ===================================================
echo             Starting Teach Chhota
echo ===================================================
echo.
echo Starting Backend API Server (Port 5000)...
start "Teach Chhota - Backend API (Port 5000)" cmd /k "pnpm --filter @workspace/api-server run dev"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Frontend Web App (Port 5173)...
start "Teach Chhota - Frontend Web (Port 5173)" cmd /k "pnpm --filter @workspace/teach-chhota run dev"

echo Waiting for frontend dev server...
timeout /t 3 /nobreak >nul

echo Opening application in your default browser...
start http://localhost:5173

echo.
echo ===================================================
echo Teach Chhota is now running!
echo.
echo   Frontend Web:  http://localhost:5173
echo   Backend API:   http://localhost:5000
echo.
echo Note: Keep the two spawned terminal windows open.
echo To stop the servers, simply close those terminal windows.
echo ===================================================
echo.
pause
