#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "     INICIANDO ECOSISTEMA SERVILLANTAS SYSTEM"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$ROOT_DIR/data" "$ROOT_DIR/logs"

SERVICES=(
  "ms-productos:8082"
  "ms-autenticacion-usuarios:8081"
  "ms-inventario:8083"
  "ms-compras:8084"
  "ms-ventas:8085"
  "ms-servicios:8086"
  "ms-alertas-notificaciones:8087"
  "ms-reportes:8088"
  "ms-asistente-ia:8089"
  "ms-api-gateway:8080"
)

for item in "${SERVICES[@]}"; do
  SVC="${item%%:*}"
  PORT="${item##*:}"
  echo "Iniciando $SVC (puerto $PORT)..."
  (
    cd "$ROOT_DIR/$SVC"
    MVN_CMD="./mvnw"
    [ ! -f "$MVN_CMD" ] && MVN_CMD="mvn"
    nohup $MVN_CMD spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx160m" > "$ROOT_DIR/logs/$SVC.log" 2>&1 &
  )
  sleep 2
done

echo "Iniciando Frontend Angular..."
(
  cd "$ROOT_DIR/frontend"
  nohup npm start > "$ROOT_DIR/logs/frontend.log" 2>&1 &
)

echo "=========================================================="
echo "  Todos los servicios arrancados."
echo "  - Frontend:    http://localhost:4200"
echo "  - API Gateway: http://localhost:8080"
echo "=========================================================="
