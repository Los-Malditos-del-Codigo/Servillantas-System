package com.servillantas.compras.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProveedorDto(
    UUID id,
    String nombre,
    String ruc,
    String telefono,
    String email,
    String direccion,
    Boolean activo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
