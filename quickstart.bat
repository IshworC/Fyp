@echo off
REM Quick Start Script for SAN Venue Booking System

echo.
echo ===============================================
echo   SAN Venue Booking System - Quick Start
echo ===============================================
echo.

REM Check if backend node_modules exists
if not exist "backend\node_modules\" (
    echo [1/4] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies already installed
)

echo.

REM Check if frontend node_modules exists
if not exist "Saan\node_modules\" (
    echo [2/4] Installing frontend dependencies...
    cd Saan
    call npm install
    cd ..
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies already installed
)

echo.
echo [3/4] Ready to start services
echo.
echo Make sure MongoDB is running before proceeding!
echo.
echo To complete setup:
echo.
echo 1. Open Terminal 1 and run (from backend folder):
echo    npm run seed
echo.
echo 2. Open Terminal 2 and run (from backend folder):
echo    npm run dev
echo.
echo 3. Open Terminal 3 and run (from Saan folder):
echo    npm run dev
echo.
echo ===============================================
echo Backend URL: http://localhost:5000
echo Frontend URL: http://localhost:5173
echo ===============================================
echo.

pause
