@echo off
REM Test Login API Script for Windows

echo.
echo ====================================
echo Testing SAN Login System
echo ====================================
echo.

REM Check if backend is running
echo Checking if backend is running on http://localhost:5000...
powershell -Command "$null = Invoke-WebRequest -Uri 'http://localhost:5000' -ErrorAction SilentlyContinue; if ($?) { Write-Host '✓ Backend is running' } else { Write-Host '✗ Backend is NOT running. Please start it with: npm run dev' }"

echo.
echo Testing login with test user credentials...
echo.

REM Test User Login
powershell -Command "
`$body = @{
    email = 'user@gmail.com'
    password = 'user@123'
} | ConvertTo-Json

try {
    `$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
      -Method POST `
      -Headers @{'Content-Type'='application/json'} `
      -Body `$body

    `$result = `$response.Content | ConvertFrom-Json
    
    if (`$result.success) {
        Write-Host '✓ LOGIN SUCCESSFUL!' -ForegroundColor Green
        Write-Host 'User: '$result.user.name
        Write-Host 'Email: '$result.user.email
        Write-Host 'Role: '$result.user.role
        Write-Host 'Token received: '$result.token.Substring(0, 50)'...'
    } else {
        Write-Host '✗ Login failed: '$result.message -ForegroundColor Red
    }
} catch {
    Write-Host '✗ Error: '$_.Exception.Message -ForegroundColor Red
    Write-Host 'Make sure:' -ForegroundColor Yellow
    Write-Host '  1. MongoDB is running'
    Write-Host '  2. Backend is running (npm run dev in backend folder)'
    Write-Host '  3. Test users are seeded (npm run seed in backend folder)'
}
"

echo.
echo Testing Venue Owner Login...
echo.

REM Test Venue Owner Login
powershell -Command "
`$body = @{
    email = 'venue@gmail.com'
    password = 'venue@123'
} | ConvertTo-Json

try {
    `$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
      -Method POST `
      -Headers @{'Content-Type'='application/json'} `
      -Body `$body

    `$result = `$response.Content | ConvertFrom-Json
    
    if (`$result.success) {
        Write-Host '✓ VENUE OWNER LOGIN SUCCESSFUL!' -ForegroundColor Green
        Write-Host 'User: '$result.user.name
        Write-Host 'Email: '$result.user.email
        Write-Host 'Role: '$result.user.role
    } else {
        Write-Host '✗ Login failed: '$result.message -ForegroundColor Red
    }
} catch {
    Write-Host '✗ Error: '$_.Exception.Message -ForegroundColor Red
}
"

echo.
echo Testing Admin Login...
echo.

REM Test Admin Login
powershell -Command "
`$body = @{
    email = 'admin@saan.com'
    password = 'admin@123'
} | ConvertTo-Json

try {
    `$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
      -Method POST `
      -Headers @{'Content-Type'='application/json'} `
      -Body `$body

    `$result = `$response.Content | ConvertFrom-Json
    
    if (`$result.success) {
        Write-Host '✓ ADMIN LOGIN SUCCESSFUL!' -ForegroundColor Green
        Write-Host 'User: '$result.user.name
        Write-Host 'Email: '$result.user.email
        Write-Host 'Role: '$result.user.role
    } else {
        Write-Host '✗ Login failed: '$result.message -ForegroundColor Red
    }
} catch {
    Write-Host '✗ Error: '$_.Exception.Message -ForegroundColor Red
}
"

echo.
echo ====================================
echo Test Complete
echo ====================================
echo.
pause
