@echo off
echo 🚀 Starting StyleGen AI Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found
    echo Please create a .env file with your configuration
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Starting server...
echo.
echo 🌐 The server will be available at:
echo    - Health Check: http://localhost:5002/api/health
echo    - Test Endpoint: http://localhost:5002/api/test
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

node simple.js
