<#
.SYNOPSIS
  Script para detener todos los procesos de Servillantas en Windows.
#>

Write-Host "Deteniendo procesos Java (Microservicios)..." -ForegroundColor Yellow
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] Microservicios detenidos." -ForegroundColor Green

Write-Host "Buscando procesos Node (Frontend)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] Frontend detenido." -ForegroundColor Green
Write-Host "Sistema Servillantas completamente detenido." -ForegroundColor Cyan

