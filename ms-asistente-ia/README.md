# ms-asistente-ia

Microservicio de conversaciones y mensajes IA de Servillantas RV. Aplica aislamiento por usuario y solo permite mensajes `USER` desde clientes externos.

- Puerto por defecto: `8089`
- Health: `/actuator/health`
- API: `/api/v1/conversaciones-ia`

Requiere `SPRING_DATASOURCE_URL`, `DB_USER` y `DB_PASSWORD`.
