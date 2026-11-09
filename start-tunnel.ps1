<#
.SYNOPSIS
  Inicia el túnel HTTPS público y gratuito de Cloudflare hacia el API Gateway (puerto 8080).
#>
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     INICIANDO TUNEL HTTPS CLOUDFLARE - SERVILLANTAS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Conectando http://localhost:8080 a la red global de Cloudflare..." -ForegroundColor Yellow

.\cloudflared.exe tunnel --url http://localhost:8080

