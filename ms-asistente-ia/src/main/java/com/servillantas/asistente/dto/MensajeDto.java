package com.servillantas.asistente.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MensajeDto(
    UUID id,
    UUID conversacionId,
    String rolMensaje,
    String contenido,
    OffsetDateTime createdAt
) {}

