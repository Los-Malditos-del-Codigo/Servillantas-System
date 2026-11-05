package com.servillantas.reportes.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record ReporteDto(
    UUID id,
    UUID usuarioId,
    String tipo,
    String formato,
    Map<String, Object> parametros,
    String archivoUrl,
    OffsetDateTime createdAt
) {}

