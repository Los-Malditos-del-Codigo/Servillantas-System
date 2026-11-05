package com.servillantas.ventas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record VentaResumenDto(
    UUID id,
    OffsetDateTime fecha,
    String estado,
    BigDecimal total,
    String observacion,
    int cantidadItems,
    UUID usuarioId
) {}
