# Smart Campus Digital Twin & Facility Intelligence Platform
# Unified Start Script

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Smart Campus Platform (Backend + Frontend)   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory "$PSScriptRoot\backend"

# 2. Start Vite Frontend in background
$viteJs = "$PSScriptRoot\frontend\node_modules\vite\bin\vite.js"
Start-Process -FilePath "node" -ArgumentList "`"$viteJs`" --host 0.0.0.0 --port 5173" -WorkingDirectory "$PSScriptRoot\frontend"

Write-Host "`n[OK] Backend running at:  http://localhost:8000 (API Docs: http://localhost:8000/docs)" -ForegroundColor Green
Write-Host "[OK] Frontend running at: http://localhost:5173" -ForegroundColor Green
Write-Host "`nAll services successfully initiated!" -ForegroundColor Cyan
