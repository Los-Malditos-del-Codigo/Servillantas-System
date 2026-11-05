package com.servillantas.inventario.dto.kardex;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MovimientoKardexResponse(
        UUID id,
        UUID productoId,
        String tipo,
        BigDecimal cantidad,
        BigDecimal stockAnterior,
        BigDecimal stockPosterior,
        BigDecimal costoUnitario,
        String motivo,
        String observaciones,
        String registradoPor,
        OffsetDateTime createdAt
) {
}
