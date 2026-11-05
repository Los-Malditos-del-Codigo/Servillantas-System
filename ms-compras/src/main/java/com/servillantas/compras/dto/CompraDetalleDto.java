package com.servillantas.compras.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CompraDetalleDto(
    UUID id,
    ProveedorResumenDto proveedor,
    UUID usuarioId,
    String estado,
    OffsetDateTime fecha,
    BigDecimal total,
    String observacion,
    String motivoAnulacion,
    OffsetDateTime recibidaAt,
    OffsetDateTime anuladaAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<DetalleCompraDto> items
) {}
