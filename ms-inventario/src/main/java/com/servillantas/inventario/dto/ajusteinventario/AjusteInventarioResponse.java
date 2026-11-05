package com.servillantas.inventario.dto.ajusteinventario;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AjusteInventarioResponse(
        UUID id,
        UUID productoId,
        UUID usuarioId,
        String tipo,
        BigDecimal cantidad,
        String motivo,
        String observacion,
        String idempotencyKey,
        OffsetDateTime fechaCreacion
) {
}
