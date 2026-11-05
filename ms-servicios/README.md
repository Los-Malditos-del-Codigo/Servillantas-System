# MS-Servicios — Servillantas RV (Spring Boot 4)

Microservicio de gestión de servicios de taller y consumo de materiales para Servillantas RV, implementado con Spring Boot 4.0.0, Java 21, Spring Data JPA, Hibernate con validación contra PostgreSQL Supabase, y descuento de materiales contra MS-Inventario.

---

## 1. Alcance implementado
- **HU-20**: Registrar servicios de taller con tipo y precio (estado inicial `REALIZADO`), validando que el tipo de servicio esté activo.
- **HU-21**: Registrar materiales utilizados en un servicio y emitir la salida de inventario correspondiente mediante clave determinística idempotente.
- **HU-22**: Consultar historial de servicios con filtros (`tipoServicioId`, `estado`, `desde`, `hasta`) y paginación; consultar detalle del servicio con su desglose de materiales.

Fuera de alcance (respetado según especificación): CRUD de tipos de servicio (HU-52), anulación de servicios (HU-53), edición y anulación de materiales. Columnas `motivo_anulacion`, `anulada_at` y `anulacion_idempotency_key` mapeadas como de solo lectura. Para HU-20 se expone únicamente consulta de solo lectura de tipos de servicio activos.

---

## 2. Variables de entorno

Configuradas mediante `.env` (véase `.env.example`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_HOST` | Host PostgreSQL Supabase | `aws-0-us-east-1.pooler.supabase.com` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_NAME` | Nombre de base de datos | `postgres` |
| `DB_USER` | Usuario pooler Supabase | `postgres.snxkqrwgoupanzxyjrst` |
| `DB_PASSWORD` | Contraseña del pooler | *(Obligatorio en producción)* |
| `SERVER_PORT` | Puerto HTTP del microservicio | `8086` |
| `INVENTARIO_BASE_URL` | URL base de MS-Inventario | `http://localhost:8080` |
| `INVENTARIO_STUB` | Activa cliente simulado de inventario | `false` |

---

## 3. Cómo ejecutar

### Requisitos:
- Java 21 (OpenJDK / Microsoft OpenJDK 21)
- Apache Maven 3.9+

### Compilación y pruebas unitarias/slice:
```bash
mvn clean test
```

### Ejecución local:
```powershell
$env:DB_PASSWORD="<tu_password>"
mvn spring-boot:run
```

El servicio estará disponible en `http://localhost:8086`.

- **Actuator Health**: [http://localhost:8086/actuator/health](http://localhost:8086/actuator/health)
- **Documentación OpenAPI / Swagger**: [http://localhost:8086/swagger-ui](http://localhost:8086/swagger-ui)
- **Especificación OpenAPI JSON**: [http://localhost:8086/v3/api-docs](http://localhost:8086/v3/api-docs)

---

## 4. Endpoints

### `GET /api/v1/tipos-servicio?activo=true` (HU-20)
- Consulta solo lectura para select de tipos de servicio activos (`id`, `nombre`, `descripcion`, `precioReferencial`).

### `POST /api/v1/servicios` (HU-20)
- **Cabeceras obligatorias**: `Idempotency-Key` (UUID).
- **Cabeceras opcionales**: `X-Correlation-Id` (UUID), `X-User-Id` (UUID).
- **Body**:
```json
{
  "tipoServicioId": "d38d3886-0fa9-432a-bc9e-bbbebe100001",
  "precio": 55.00,
  "fecha": "2026-10-15T16:00:00Z",
  "observacion": "Alineación y balanceo vehículo liviano"
}
```
- **Respuestas**:
  - `201 Created` + `Location: /api/v1/servicios/{id}`.
  - `200 OK` + header `Idempotent-Replayed: true` (repetición idéntica).
  - `400 Bad Request` (tipo inactivo o precio negativo).
  - `404 Not Found` (tipo no existente).

### `POST /api/v1/servicios/{id}/materiales` (HU-21)
- **Cabeceras obligatorias**: `Idempotency-Key` (UUID).
- **Body**:
```json
{
  "productoId": "b184dc95-8747-4f9f-9b78-5cfdaa76529d",
  "cantidad": 1
}
```
- **Respuestas**:
  - `201 Created` con el material registrado.
  - `409 Conflict` (`STOCK_INSUFICIENTE` si MS-Inventario no dispone de stock o producto duplicado en servicio).
  - `503 Service Unavailable` (`INVENTARIO_NO_DISPONIBLE`).

### `GET /api/v1/servicios` (HU-22)
- **Filtros**: `tipoServicioId`, `estado`, `desde` (YYYY-MM-DD), `hasta` (YYYY-MM-DD), paginación `page`, `size`, `sortBy`, `sortDir`.
- **Elemento**: `id`, `fecha`, `tipoServicioId`, `tipoServicioNombre`, `precio`, `estado`, `observacion`, `cantidadMateriales`.

### `GET /api/v1/servicios/{id}` (HU-22)
- Cabecera del servicio + lista completa de materiales consumidos (`id`, `productoId`, `cantidad`, `createdAt`).

---

## 5. Contrato asumido con MS-Inventario (Pendiente de confirmar)

1. **Salida por material usado en servicio**:
   `POST {INVENTARIO_BASE_URL}/api/v1/inventario/salidas`
   - Body:
     ```json
     {
       "productoId": "<UUID>",
       "cantidad": 1,
       "motivo": "Uso en servicio",
       "referenciaTipo": "servicio",
       "referenciaId": "<servicioId>",
       "referenciaDetalleId": "<materialId>"
     }
     ```
   - Headers: `Idempotency-Key: <key>-SALIDA`, `X-Correlation-Id`, `X-User-Id`, `Authorization`.

---

## 6. Supuestos y elementos por confirmar
- **Autenticación**: `X-User-Id` inyectado por el API Gateway tras validar JWT. Valor por defecto configurable en `app.auth.default-user-id` para pruebas locales. *(Por confirmar contra el API Gateway real).*
- **Contrato de Inventario**: Endpoint de salidas contra contrato acordado. *(Pendiente de confirmar contra el MS-Inventario desplegado).*
