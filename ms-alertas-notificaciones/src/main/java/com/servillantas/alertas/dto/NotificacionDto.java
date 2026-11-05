package com.servillantas.alertas.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificacionDto(
    UUID id,
    UUID alertaId,
    UUID usuarioId,
    String mensaje,
    boolean leida,
    OffsetDateTime readAt,
    OffsetDateTime createdAt
) {}

