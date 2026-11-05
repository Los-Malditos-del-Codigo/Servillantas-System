package com.servillantas.servicios.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ServicioDetalleDto(
    UUID id,
    UUID tipoServicioId,
    String tipoServicioNombre,
    UUID usuarioId,
    BigDecimal precio,
    OffsetDateTime fecha,
    String observacion,
    String estado,
    OffsetDateTime anuladaAt,
    String motivoAnulacion,
    List<MaterialServicioDto> materiales,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
