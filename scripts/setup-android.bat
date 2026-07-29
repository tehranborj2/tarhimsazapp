@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."

if not exist "package.json" (
    echo [ERROR] package.json was not found in: %CD%
    echo Extract the ZIP completely and run this file again.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 22 or newer is required.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found.
    pause
    exit /b 1
)

echo.
echo [1/3] Installing project packages...
call npm install --no-audit --no-fund
if errorlevel 1 goto :failed

echo.
echo [2/3] Preparing the Android release project...
call npm run android:prepare
if errorlevel 1 goto :failed

echo.
echo [3/3] Opening Android Studio...
call npx cap open android
if errorlevel 1 goto :failed

exit /b 0

:failed
echo.
echo [ERROR] Setup stopped because a command failed.
echo Project folder: %CD%
pause
exit /b 1
