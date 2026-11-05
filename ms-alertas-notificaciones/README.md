# ms-alertas-notificaciones

Microservicio de alertas de stock y notificaciones de Servillantas RV. Usa Spring Boot 4.1, PostgreSQL, Config Server y Eureka.

- Puerto por defecto: `8087`
- Health: `/actuator/health`
- API: `/api/v1/alertas` y `/api/v1/notificaciones`

Requiere `SPRING_DATASOURCE_URL`, `DB_USER` y `DB_PASSWORD`. Config Server se localiza mediante `CONFIG_SERVER_URL`.
