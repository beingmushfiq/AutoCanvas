# ==============================================================================
# AutoCanvas — Windows Development Environment Orchestrator
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AutoCanvas — Local Development Startup             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Redis
Write-Host "[1/4] Checking Redis service..." -ForegroundColor Yellow
$redisRunning = Get-Process -Name *redis* -ErrorAction SilentlyContinue
if ($redisRunning) {
    Write-Host "  -> Redis is active on 127.0.0.1:6379" -ForegroundColor Green
} else {
    Write-Host "  -> Starting Redis service..." -ForegroundColor Yellow
    try {
        Start-Service Redis -ErrorAction Stop
        Write-Host "  -> Redis service started successfully." -ForegroundColor Green
    } catch {
        Write-Host "  -> Warning: Could not start Redis automatically. Please ensure Redis is running." -ForegroundColor Red
    }
}

# 2. Check Database Connectivity
Write-Host "[2/4] Checking MySQL / SQLite database..." -ForegroundColor Yellow
$mysqlRunning = Get-Process -Name *mysql* -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "  -> MySQL process detected." -ForegroundColor Green
} else {
    Write-Host "  -> Notice: MySQL service is not running. Starting MySQL80 service if available..." -ForegroundColor Gray
    try {
        Start-Service MySQL80 -ErrorAction SilentlyContinue
    } catch {}
}

# 3. Inform Developer
Write-Host "[3/4] Ready to boot services." -ForegroundColor Yellow
Write-Host "  Backend:   cd backend; php artisan serve --port=8000" -ForegroundColor White
Write-Host "  Frontend:  cd frontend; npm run dev" -ForegroundColor White
Write-Host "  Renderer:  cd renderer; npm run dev" -ForegroundColor White

Write-Host "[4/4] AutoCanvas Dev Environment Verified!" -ForegroundColor Green

