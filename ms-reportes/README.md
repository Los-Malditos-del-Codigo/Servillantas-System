# ms-reportes

Microservicio de registro y consulta de reportes PDF/XLSX de Servillantas RV. Usa Spring Boot 4.1, PostgreSQL, Config Server y Eureka.

- Puerto por defecto: `8088`
- Health: `/actuator/health`
- API: `/api/v1/reportes`

Requiere `SPRING_DATASOURCE_URL`, `DB_USER` y `DB_PASSWORD`.
