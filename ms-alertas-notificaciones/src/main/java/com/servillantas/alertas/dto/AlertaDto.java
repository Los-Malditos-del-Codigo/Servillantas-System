package com.servillantas.alertas.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertaDto(
    UUID id,
    UUID productoId,
    String tipo,
    String estado,
    String mensaje,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime resueltaAt
) {}

