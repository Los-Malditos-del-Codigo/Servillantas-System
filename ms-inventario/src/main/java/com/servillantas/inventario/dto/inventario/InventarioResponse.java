package com.servillantas.inventario.dto.inventario;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventarioResponse(
        UUID id,
        UUID productoId,
        BigDecimal stockActual,
        Long version,
        OffsetDateTime fechaCreacion,
        OffsetDateTime fechaActualizacion
) {
}
