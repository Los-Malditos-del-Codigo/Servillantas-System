# Servillantas System 🚗💨

Plataforma empresarial distribuida basada en microservicios y Single Page Application (SPA) para la gestión integral de centros automotrices, comercialización de neumáticos, lubricantes, repuestos y control de servicios de taller mecánico.

---

## 🏛️ Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada de microservicios alineada a principios de **Domain-Driven Design (DDD)**, con **API Gateway** como único punto de entrada perimetral y una base de datos relacional compartida.

```
+-----------------------------------------------------------------------+
|                    Cliente Web / Navegador (SPA)                     |
|                        http://localhost:4200                          |
+-----------------------------------------------------------------------+
                                   |
                                   v  (CORS / HTTP REST / JWT)
+-----------------------------------------------------------------------+
|                       MS-API-GATEWAY (Puerto 8080)                    |
|      - Único perímetro expuesto al exterior (Hardening OWASP / SOC 2) |
|      - Rate Limiting, Correlation ID, Content-Security-Policy         |
+-----------------------------------------------------------------------+
        |                |                 |                |
        +----------------+-----------------+----------------+
        |                |                 |                |
        v                v                 v                v
+---------------+ +---------------+ +---------------+ +---------------+
| ms-auth (8081)| |ms-prod (8082) | |ms-invent(8083)| |ms-compra(8084)|
+---------------+ +---------------+ +---------------+ +---------------+
        |                |                 |                |
        v                v                 v                v
+---------------+ +---------------+ +---------------+ +---------------+
| ms-venta(8085)| |ms-serv (8086) | |ms-alerta(8087)| |ms-report(8088)|
+---------------+ +---------------+ +---------------+ +---------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|               BASE DE DATOS UNIFICADA (servillantas_db)               |
|      - H2 File con AUTO_SERVER=TRUE (Desarrollo local sincronizado)   |
|      - Compatible con PostgreSQL 15+ / Supabase (Producción)          |
+-----------------------------------------------------------------------+
```

---

## 🔒 Estándares de Seguridad y Endurecimiento (Hardening)

- **OWASP API Security Top 10**:
  - `API1: Broken Object Level Authorization`: Validación de identidad (`X-User-Id`, claims de JWT) en cada servicio.
  - `API2: Broken Authentication`: Tokens JWT HMAC-SHA512 con expiración controlada y rotación.
  - `API4: Unrestricted Resource Consumption`: Paginación obligatoria (`PageResponseDto`), filtros de ordenamiento y límites de tamaño.
  - `API5: Broken Function Level Authorization`: Restricción de operaciones de escritura a rol `PROPIETARIO` en API Gateway.
  - `API8: Security Misconfiguration`: Cabeceras estrictas inyectadas (`CSP`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
- **SOC 2 & ISO 27001 / ISO 27701**:
  - **Trazabilidad & Auditoría (CC6.1 / CC6.8)**: Generación e inyección automática de cabecera `X-Correlation-Id` en toda la cadena de llamadas.
  - **Principio de Mínimo Privilegio (CC6.3)**: Red interna privada para microservicios; únicamente el Gateway expone puertos hacia el frontend.
  - **Idempotencia Transaccional**: Cabecera `Idempotency-Key` en operaciones críticas de compras, ventas y servicios para prevenir dobles cobros o desbalances de stock.

---

## 📦 Catálogo de Microservicios y Mapeo de Puertos

| Servicio | Puerto | Rama V3 | Repositorio Oficial |
| :--- | :---: | :---: | :--- |
| **frontend** | `4200` | `frontend-v3` | [frontend-servillantas](https://github.com/Los-Malditos-del-Codigo/frontend-servillantas.git) |
| **ms-api-gateway** | `8080` | `ms-api-gateway-v3` | [ms-api-gateway](https://github.com/Los-Malditos-del-Codigo/ms-api-gateway.git) |
| **ms-autenticacion-usuarios** | `8081` | `ms-autenticacion-usuarios-v3` | [ms-autenticacion-usuarios](https://github.com/Los-Malditos-del-Codigo/ms-autenticacion-usuarios.git) |
| **ms-productos** | `8082` | `ms-productos-v3` | [ms-productos](https://github.com/Los-Malditos-del-Codigo/ms-productos.git) |
| **ms-inventario** | `8083` | `ms-inventario-v3` | [ms-inventario](https://github.com/Los-Malditos-del-Codigo/ms-inventario.git) |
| **ms-compras** | `8084` | `ms-compras-v3` | [MS-Compras](https://github.com/Los-Malditos-del-Codigo/MS-Compras.git) |
| **ms-ventas** | `8085` | `ms-ventas-v3` | [MS-Ventas](https://github.com/Los-Malditos-del-Codigo/MS-Ventas.git) |
| **ms-servicios** | `8086` | `ms-servicios-v3` | [MS-Servicios](https://github.com/Los-Malditos-del-Codigo/MS-Servicios.git) |
| **ms-alertas-notificaciones** | `8087` | `ms-alertas-notificaciones-v3` | [ms-alertas-notificaciones](https://github.com/Los-Malditos-del-Codigo/ms-alertas-notificaciones.git) |
| **ms-reportes** | `8088` | `ms-reportes-v3` | [ms-reportes](https://github.com/Los-Malditos-del-Codigo/ms-reportes.git) |
| **ms-asistente-ia** | `8089` | `ms-asistente-ia-v3` | [ms-asistente-ia](https://github.com/Los-Malditos-del-Codigo/ms-asistente-ia.git) |
| **ms-eureka-server** | `8761` | `ms-eureka-server-v3` | [ms-eureka-server](https://github.com/Los-Malditos-del-Codigo/ms-eureka-server.git) |
| **ms-config-server** | `8888` | `ms-config-server-v3` | [ms-config-server](https://github.com/Los-Malditos-del-Codigo/ms-config-server.git) |

---

## 🚀 Requisitos Previos

1. **Java JDK 21** instalado y configurado en `JAVA_HOME`.
2. **Node.js 18+ o 20+** y `npm` para el frontend Angular.
3. **Maven 3.9+** (los microservicios ya incluyen el `mvnw` wrapper).
4. *(Opcional)* **Docker** y **Docker Compose** para despliegue contenerizado.

---

## ⚡ Instrucciones de Inicio Rápido

### Opción 1: En Windows con PowerShell (Recomendado)

En la raíz del proyecto, ejecuta el script automatizado:

```powershell
.\start-all.ps1
```

> **Nota**: El script inicializará la base de datos compartida, lanzará secuencialmente cada microservicio limitando su consumo de memoria (`-Xmx160m`) y levantará el frontend en segundo plano.

Para detener todos los servicios:
```powershell
.\stop-all.ps1
```

---

### Opción 2: En Linux / macOS / Bash

```bash
chmod +x start-all.sh
./start-all.sh
```

---

### Opción 3: Con Docker Compose

Para levantar toda la suite en contenedores aislados:

```bash
docker compose up --build
```

---

## 🔑 Credenciales de Acceso

Al arrancar, el microservicio de autenticación inicializa automáticamente los usuarios de prueba:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **PROPIETARIO** | `admin@servillantas.pe` | `admin123` | Control total, administración de catálogos, auditoría y compras |
| **PERSONAL** | `operador@servillantas.pe` | `operador123` | Ventas mostrador, servicios de taller y registro de movimientos |

---

## 📱 Módulos de la Aplicación Web

Accede en tu navegador a: **`http://localhost:4200`**

- **/productos**: Gestión de neumáticos, lubricantes, baterías, marcas, categorías y unidades de medida.
- **/inventario**: Vista en tiempo real del stock, valorización, registro de entradas y salidas, e historial de Kardex.
- **/compras**: Directorio de proveedores con RUC, registro de órdenes de compra con cálculo de IGV, recepción y anulación.
- **/ventas**: Punto de venta (POS), cálculo automático de subtotales, confirmación de ventas y emisión de boletas/facturas.
- **/taller**: Registro de servicios automotrices (alineación, balanceo, frenos, cambio de aceite), asignación de mecánicos y consumo de materiales de inventario.
- **/reportes**: Tableros analíticos de desempeño, filtros por rango de fecha y exportación a formatos Excel e impresión.
- **/alertas**: Monitor de stock crítico y agotado con notificaciones visuales y auditivas.

---

## 🛠️ Rutas Principales del API Gateway (`http://localhost:8080`)

| Módulo | Endpoint Base | Descripción |
| :--- | :--- | :--- |
| **Autenticación** | `POST /api/v1/auth/login` | Inicio de sesión y emisión de token JWT |
| **Productos** | `GET /api/v1/productos` | Listado y filtros de catálogo |
| **Unidades** | `GET /api/v1/unidades-medida` | Unidades de medida (UND, L, KG, M, JGO) |
| **Categorías** | `GET /api/v1/categorias` | Categorías de repuestos y suministros |
| **Marcas** | `GET /api/v1/marcas` | Marcas registradas (Michelin, Castrol, Bosch, etc.) |
| **Inventario** | `GET /api/v1/inventario/stock` | Existencias actuales por producto |
| **Entradas Kardex** | `POST /api/v1/inventario/entradas` | Ingreso de mercadería |
| **Compras** | `GET, POST /api/v1/compras` | Registro e historial de compras a proveedores |
| **Proveedores** | `GET, POST /api/v1/proveedores` | Directorio de proveedores |
| **Ventas** | `GET, POST /api/v1/ventas` | Registro e historial de ventas |
| **Taller** | `GET, POST /api/v1/servicios` | Órdenes de servicio técnico |
| **Tipos Servicio** | `GET /api/v1/tipos-servicio` | Catálogo de servicios de taller |
| **Alertas** | `GET /api/v1/alertas` | Alertas activas de inventario |
| **Reportes** | `GET, POST /api/v1/reportes` | Solicitudes y descargas de reportes |

---

## 👥 Equipo de Desarrollo

Desarrollado con ❤️ por el equipo **Los Malditos del Código**.
Repositorio central: [https://github.com/Los-Malditos-del-Codigo/Servillantas-System.git](https://github.com/Los-Malditos-del-Codigo/Servillantas-System.git)

