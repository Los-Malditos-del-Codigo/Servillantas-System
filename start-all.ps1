<#
.SYNOPSIS
  Script para iniciar todo el ecosistema Servillantas (Microservicios + API Gateway + Frontend) en Windows.
#>

$root = $PSScriptRoot
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     INICIANDO ECOSISTEMA SERVILLANTAS SYSTEM" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Configuración de JAVA_HOME si no existe
if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Users\fabri\.jdks\ms-21.0.11") {
        $env:JAVA_HOME = "C:\Users\fabri\.jdks\ms-21.0.11"
    }
}
if ($env:JAVA_HOME) {
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
    Write-Host "[OK] Usando JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "[WARN] JAVA_HOME no establecido; se usara el 'java' del PATH." -ForegroundColor Yellow
}

# 2. Directorios de datos y logs
$dataDir = Join-Path $root "data"
$logsDir = Join-Path $root "logs"
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir | Out-Null }
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

$services = @(
    @{ Name = "ms-productos"; Port = 8082 },
    @{ Name = "ms-autenticacion-usuarios"; Port = 8081 },
    @{ Name = "ms-inventario"; Port = 8083 },
    @{ Name = "ms-compras"; Port = 8084 },
    @{ Name = "ms-ventas"; Port = 8085 },
    @{ Name = "ms-servicios"; Port = 8086 },
    @{ Name = "ms-alertas-notificaciones"; Port = 8087 },
    @{ Name = "ms-reportes"; Port = 8088 },
    @{ Name = "ms-asistente-ia"; Port = 8089 },
    @{ Name = "ms-api-gateway"; Port = 8080 }
)

Write-Host "`n>>> Iniciando Microservicios en segundo plano..." -ForegroundColor Yellow

foreach ($svc in $services) {
    $svcPath = Join-Path $root $svc.Name
    $logPath = Join-Path $logsDir "$($svc.Name).log"
    Write-Host "Iniciando $($svc.Name) (Puerto: $($svc.Port))..." -NoNewline
    
    $mvnCmd = if (Test-Path (Join-Path $svcPath "mvnw.cmd")) { "mvnw.cmd" } else { "mvn" }
    
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$svcPath`" && $mvnCmd spring-boot:run -Dspring-boot.run.jvmArguments=-Xmx160m > `"$logPath`" 2>&1" `
        -WindowStyle Hidden
    
    Write-Host " [INICIADO]" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host "`n>>> Iniciando Frontend Angular (Puerto 4200)..." -ForegroundColor Yellow
$frontPath = Join-Path $root "frontend"
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d `"$frontPath`" && npm start > `"$logsDir\frontend.log`" 2>&1" `
    -WindowStyle Hidden

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Todos los servicios estan arrancando en segundo plano." -ForegroundColor Green
Write-Host "  - Frontend:    http://localhost:4200" -ForegroundColor White
Write-Host "  - API Gateway: http://localhost:8080" -ForegroundColor White
Write-Host "  - Credenciales demo:" -ForegroundColor White
Write-Host "      admin@servillantas.pe    / admin123  (PROPIETARIO)" -ForegroundColor Yellow
Write-Host "      operador@servillantas.pe / operador123 (PERSONAL)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Para detener todos los servicios ejecuta: .\stop-all.ps1" -ForegroundColor Gray
