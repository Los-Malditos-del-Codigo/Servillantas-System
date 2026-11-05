package com.servillantas.ventas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record VentaDetalleDto(
    UUID id,
    UUID usuarioId,
    String estado,
    OffsetDateTime fecha,
    BigDecimal total,
    String observacion,
    List<DetalleVentaDto> items,
    OffsetDateTime confirmadaAt,
    OffsetDateTime anuladaAt,
    String motivoAnulacion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
