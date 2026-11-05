# MS-Compras · Microservicio de Compras y Proveedores — Servillantas RV

Microservicio backend desarrollado con **Spring Boot 4 (Java 21)**, **Spring Data JPA** y **PostgreSQL** (Supabase) para la gestión integral de proveedores, registro de adquisiciones y confirmación de recepción enlazada a inventario para **Servillantas RV**.

---

## 1. Arquitectura y Convenciones

El microservicio se integra en el ecosistema Servillantas RV respetando la arquitectura y convenciones de los microservicios hermanos (`ms-autenticacion-usuarios`, `ms-productos`, `ms-ventas`, `ms-servicios`):

- **Arquitectura en capas**:
  - `controller`: Exposición de endpoints REST y validación de entrada (`@Valid`).
  - `service`: Lógica de negocio, cálculos de totales y orquestación de transacciones `@Transactional`.
  - `domain`: Entidades JPA mapeadas a las tablas reales de PostgreSQL.
  - `repository`: Acceso a datos con Spring Data JPA y bloqueos pesimistas para concurrencia.
  - `client`: Comunicación HTTP con `MS-Inventario` utilizando `RestClient` de Spring Boot 4.
  - `dto`: Inmutabilidad con Java `record`, serialización en `snake_case` y compatibilidad dual `@JsonAlias`.
  - `config`: Configuración de CORS reactivo, MDC para `X-Correlation-Id` y extracción de identidad.
  - `exception`: Manejo global estandarizado en formato RFC 7807 (`ProblemDetail`) con mensajes en español.
- **Sin mappers externos (No Mappers)**:
  - Sin MapStruct, ni ModelMapper, ni clases o paquetes `mapper`. Toda conversión entre entidades y DTOs es explícita dentro de la capa de servicio.
- **Persistencia y PostgreSQL**:
  - `hibernate.ddl-auto: validate`: Valida el esquema sin alterar ni recrear tablas.
  - `subtotal` en `detalle_compras`: Generado automáticamente por PostgreSQL (`round(cantidad * costo_unitario, 2)`), mapeado con `insertable = false, updatable = false`.
  - Identificadores externos (`usuario_id`, `producto_id`): Mantenidos como escalares `UUID` sin entidades JPA que violen el desacoplamiento.
  - Bloqueo pesimista (`PESSIMISTIC_WRITE`) en recepción para evitar condiciones de carrera o recepciones simultáneas.
- **Puerto de servicio**:
  - Configurado en `8083` (`SERVER_PORT:8083`).
  - *Nota*: El puerto `8082` sugerido inicialmente está ocupado por el microservicio hermano `ms-productos`.

---

## 2. Historias de Usuario Implementadas

| Historia | Descripción | Endpoint |
|---|---|---|
| **HU-14** | Registrar proveedores | `POST /api/v1/proveedores` |
| **HU-15** | Listar y buscar proveedores | `GET /api/v1/proveedores` |
| **HU-16** | Registrar compras o reposiciones | `POST /api/v1/compras` |
| **HU-17** | Consultar historial de compras | `GET /api/v1/compras` y `GET /api/v1/compras/{id}` |
| **HU-46** | Confirmar recepción de compra | `POST /api/v1/compras/{id}/recepcion` |

---

## 3. Integración con MS-Inventario e Idempotencia (HU-46)

La regla de negocio no negociable establece:
> **Registrar una compra no aumenta el stock. Confirmar su recepción sí. Los reintentos no deben duplicar entradas.**

### Flujo de Recepción:
1. El cliente envía `POST /api/v1/compras/{id}/recepcion` con la cabecera `Idempotency-Key`.
2. Se adquiere un bloqueo pesimista `SELECT ... FOR UPDATE` sobre la compra.
3. Si la compra ya está en estado `RECIBIDA`:
   - Se devuelve el resultado existente de forma idempotente sin reenviar peticiones a MS-Inventario.
4. Si la compra está en estado `ANULADA`:
   - Se rechaza inmediatamente con `409 Conflict`.
5. Si la compra está en estado `REGISTRADA`:
   - Para cada línea de detalle, se deriva una **clave de idempotencia determinística**:
     ```
     compra-{compraId}-item-{detalleId}
     ```
   - Se invoca `POST /api/v1/inventario/entradas` en `MS-Inventario`.
   - Si la petición falla o entra en timeout, la compra se mantiene en `REGISTRADA`, permitiendo que el reintento use exactamente las mismas claves determinísticas sin riesgo de duplicar stock en inventario.
   - Una vez confirmadas todas las líneas, la compra se actualiza a `RECIBIDA`, registrando `recepcion_idempotency_key` y la marca de tiempo `recibida_at`.

---

## 4. Variables de Entorno

Crear un archivo `.env` o definir las siguientes variables en el entorno de ejecución:

```dotenv
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
DB_USER=postgres.snxkqrwgoupanzxyjrst
DB_PASSWORD=solosequenadase159
SERVER_PORT=8083
CORS_ALLOWED_ORIGINS=http://localhost:4200
INVENTARIO_BASE_URL=http://localhost:8080
INVENTARIO_STUB=false
```

---

## 5. Compilación y Ejecución

### Prerrequisitos:
- **Java**: OpenJDK 21 (LTS)
- **Maven**: 3.9+

### Compilación y ejecución de pruebas:
```bash
mvn clean test
```

### Ejecutar localmente:
```bash
mvn spring-boot:run
```

O empaquetar el JAR:
```bash
mvn clean package -DskipTests
java -jar target/ms-compras-1.0.0.jar
```

---

## 6. Documentación de API y Health

- **Swagger UI**: [http://localhost:8083/swagger-ui](http://localhost:8083/swagger-ui)
- **OpenAPI JSON**: [http://localhost:8083/v3/api-docs](http://localhost:8083/v3/api-docs)
- **Actuator Health**: [http://localhost:8083/actuator/health](http://localhost:8083/actuator/health)
- **Archivo de pruebas HTTP**: `requests.http` en la raíz del proyecto.
