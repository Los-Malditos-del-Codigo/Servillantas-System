package com.servillantas.servicios.client;

import java.math.BigDecimal;
import java.util.UUID;

public record MovimientoInventarioRequest(
    UUID productoId,
    BigDecimal cantidad,
    String motivo,
    String referenciaTipo,
    UUID referenciaId,
    UUID referenciaDetalleId
) {}
