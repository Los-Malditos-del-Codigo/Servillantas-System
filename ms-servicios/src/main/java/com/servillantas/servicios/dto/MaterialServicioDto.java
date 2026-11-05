package com.servillantas.servicios.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MaterialServicioDto(
    UUID id,
    UUID productoId,
    BigDecimal cantidad,
    OffsetDateTime createdAt
) {}
