# MS-Ventas — Servillantas RV (Spring Boot 4)

Microservicio de gestión de ventas para Servillantas RV, implementado con Spring Boot 4.0.0, Java 21, Spring Data JPA, Hibernate con validación contra PostgreSQL Supabase, y arquitectura de consistencia con saga compensatoria contra MS-Inventario.

---

## 1. Alcance implementado
- **HU-18**: Registrar venta, calcular totales, salida de stock idempotente y confirmación en una sola transacción.
- **HU-19**: Listar ventas con paginación, filtros (`estado`, `desde`, `hasta`) y orden descendente; consultar detalle completo de venta con ítems.

Fuera de alcance (respetado según especificación): anulación de ventas (HU-49), comprobantes (HU-50) y devoluciones (HU-51). Las columnas `motivo_anulacion`, `anulada_at` y `anulacion_idempotency_key` se mapean como de solo lectura sin endpoints de modificación.

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
| `SERVER_PORT` | Puerto HTTP del servicio | `8085` |
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

El servicio estará disponible en `http://localhost:8085`.

- **Actuator Health**: [http://localhost:8085/actuator/health](http://localhost:8085/actuator/health)
- **Documentación OpenAPI / Swagger**: [http://localhost:8085/swagger-ui](http://localhost:8085/swagger-ui)
- **Especificación OpenAPI JSON**: [http://localhost:8085/v3/api-docs](http://localhost:8085/v3/api-docs)

---

## 4. Endpoints

### `POST /api/v1/ventas` (HU-18)
- **Cabeceras obligatorias**: `Idempotency-Key` (UUID).
- **Cabeceras opcionales**: `X-Correlation-Id` (UUID), `X-User-Id` (UUID).
- **Body**:
```json
{
  "observacion": "Venta mostrador neumáticos",
  "items": [
    {
      "productoId": "b184dc95-8747-4f9f-9b78-5cfdaa76529d",
      "cantidad": 2,
      "precioUnitario": 180.50
    }
  ]
}
```
- **Respuestas**:
  - `201 Created` + `Location: /api/v1/ventas/{id}` (primera vez).
  - `200 OK` + cabecera `Idempotent-Replayed: true` (repetición idéntica).
  - `400 Bad Request` (validación de campos o cabecera faltante).
  - `409 Conflict` (`STOCK_INSUFICIENTE` con compensación automática o `IDEMPOTENCY_KEY_CONFLICT`).
  - `503 Service Unavailable` (`INVENTARIO_NO_DISPONIBLE`).

### `GET /api/v1/ventas` (HU-19)
- **Query params**: `estado`, `desde` (YYYY-MM-DD), `hasta` (YYYY-MM-DD), `page` (default 0), `size` (default 20, max 100), `sortBy`, `sortDir`.
- **Respuesta**:
```json
{
  "content": [
    {
      "id": "e8838706-c875-4c07-b3ff-c9bbba20149e",
      "fecha": "2026-10-15T16:00:00Z",
      "estado": "CONFIRMADA",
      "total": 361.00,
      "observacion": "Venta mostrador neumáticos",
      "cantidadItems": 1,
      "usuarioId": "00000000-0000-0000-0000-000000000001"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

### `GET /api/v1/ventas/{id}` (HU-19)
- **Respuesta**: Cabecera completa con lista de ítems (`id`, `productoId`, `cantidad`, `precioUnitario`, `subtotal`), `anuladaAt` y `motivoAnulacion`.

---

## 5. Contrato asumido con MS-Inventario (Pendiente de confirmar)

Interacción vía HTTP REST con timeouts (conexión 2s, lectura 5s) y reintento único ante 5xx o timeout:

1. **Salida por venta**:
   `POST {INVENTARIO_BASE_URL}/api/v1/inventario/salidas`
   - Body:
     ```json
     {
       "productoId": "<UUID>",
       "cantidad": 2,
       "motivo": "Venta",
       "referenciaTipo": "venta",
       "referenciaId": "<ventaId>",
       "referenciaDetalleId": "<detalleId>"
     }
     ```
   - Headers: `Idempotency-Key: <key>-LINEA-<i>`, `X-Correlation-Id`, `X-User-Id`, `Authorization`.

2. **Compensación ante fallo en línea posterior**:
   `POST {INVENTARIO_BASE_URL}/api/v1/inventario/entradas`
   - Body:
     ```json
     {
       "productoId": "<UUID>",
       "cantidad": 2,
       "motivo": "Reversión por operación fallida",
       "referenciaTipo": "venta",
       "referenciaId": "<ventaId>",
       "referenciaDetalleId": "<detalleId>"
     }
     ```
   - Headers: `Idempotency-Key: <key>-LINEA-<i>-COMPENSATE`.

---

## 6. Supuestos y elementos por confirmar
- **Autenticación**: Se asume header `X-User-Id` inyectado por el API Gateway tras validar JWT. Si está ausente, en desarrollo local se usa un UUID por defecto configurable en `app.auth.default-user-id`. *(Por confirmar contra el API Gateway real).*
- **Contrato de Inventario**: Asumido según la especificación del encargo. *(Pendiente de confirmar contra el MS-Inventario desplegado).*
