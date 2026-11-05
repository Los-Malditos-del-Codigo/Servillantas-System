package com.servillantas.asistente.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ConversacionDto(
    UUID id,
    UUID usuarioId,
    String titulo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

