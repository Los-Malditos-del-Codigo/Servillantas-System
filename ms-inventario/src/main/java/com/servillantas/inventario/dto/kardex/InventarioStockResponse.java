package com.servillantas.inventario.dto.kardex;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record InventarioStockResponse(
        UUID id,
        UUID productoId,
        BigDecimal stockActual,
        OffsetDateTime ultimaActualizacion,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
