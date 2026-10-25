@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo       Teach Chhota - Setup and Requirements
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js version 20 or higher from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js detected: %NODE_VERSION%

:: 2. Check pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] pnpm not found in PATH. Attempting to install pnpm via npm...
    call npm install -g pnpm
    where pnpm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pnpm. Please install it manually with: npm install -g pnpm
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('pnpm -v') do set PNPM_VERSION=%%v
echo [OK] pnpm detected: %PNPM_VERSION%
echo.

:: 3. Configure environment settings
echo [1/6] Configuring environment settings...
set "ROOT_DIR=%~dp0"
set "DB_FILE=%ROOT_DIR%lib\db\sqlite.db"

:: Build the DB_URL outside of any parenthesized block to avoid substitution issues
set "DB_URL=!DB_FILE:\=/!"
set "DB_URL=file:!DB_URL!"

:: Prompt for GEMINI_API_KEY if not already set in environment
if not defined GEMINI_API_KEY (
    echo.
    echo You need a Gemini API key to use AI features.
    echo Get one free at: https://aistudio.google.com/apikey
    echo.
    set /p "GEMINI_API_KEY=Enter your GEMINI_API_KEY: "
)

if "!GEMINI_API_KEY!"=="" (
    echo [WARN] No GEMINI_API_KEY provided. AI features will not work.
    set "GEMINI_API_KEY=YOUR_API_KEY_HERE"
)

if not exist "%ROOT_DIR%artifacts\api-server\.env" (
    echo Creating artifacts\api-server\.env ...
    echo DATABASE_URL="!DB_URL!"> "%ROOT_DIR%artifacts\api-server\.env"
    echo GEMINI_API_KEY="!GEMINI_API_KEY!">> "%ROOT_DIR%artifacts\api-server\.env"
    echo PORT=5000>> "%ROOT_DIR%artifacts\api-server\.env"
) else (
    echo [OK] artifacts\api-server\.env exists.
)

if not exist "%ROOT_DIR%.env" (
    echo DATABASE_URL="!DB_URL!"> "%ROOT_DIR%.env"
    echo GEMINI_API_KEY="!GEMINI_API_KEY!">> "%ROOT_DIR%.env"
)

:: 4. Install dependencies
echo.
echo [2/6] Installing dependencies across all workspaces...
call pnpm install
if %errorlevel% neq 0 (
    echo [ERROR] pnpm install failed!
    pause
    exit /b %errorlevel%
)

:: 5. Build database type declarations
echo.
echo [3/6] Building database type declarations...
call pnpm --filter @workspace/db exec tsc -b
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build database type declarations!
    pause
    exit /b %errorlevel%
)

:: 6. Push database schema to SQLite
echo.
echo [4/6] Pushing database schema to SQLite...
call pnpm --filter @workspace/db run push-force
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push database schema!
    pause
    exit /b %errorlevel%
)

:: 7. Build monorepo packages
echo.
echo [5/6] Building backend and frontend packages...
call pnpm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

:: 8. Seed cosmetic shop items
echo.
echo [6/6] Seeding cosmetic items into the database...
call pnpm --filter @workspace/api-server run seed-cosmetics
if %errorlevel% neq 0 (
    echo [WARN] Seed cosmetics script finished with notice.
)

echo.
echo ===================================================
echo       [SUCCESS] Setup Completed Successfully!
echo ===================================================
echo.
echo You can now launch Teach Chhota by running:
echo   run.bat
echo.
echo Backend will run on:  http://localhost:5000
echo Frontend will run on: http://localhost:5173
echo ===================================================
pause
