package com.servillantas.inventario.dto.movimientoinventario;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MovimientoInventarioResponse(
        UUID id,
        UUID productoId,
        UUID usuarioId,
        String tipo,
        BigDecimal cantidad,
        BigDecimal stockAnterior,
        BigDecimal stockResultante,
        String origen,
        UUID referenciaId,
        String idempotencyKey,
        UUID correlationId,
        String observacion,
        OffsetDateTime fechaCreacion
) {
}
