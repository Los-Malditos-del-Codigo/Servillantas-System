package com.servillantas.compras.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CompraResumenDto(
    UUID id,
    ProveedorResumenDto proveedor,
    UUID usuarioId,
    String estado,
    OffsetDateTime fecha,
    BigDecimal total,
    String observacion,
    OffsetDateTime recibidaAt,
    OffsetDateTime anuladaAt,
    OffsetDateTime createdAt
) {}
