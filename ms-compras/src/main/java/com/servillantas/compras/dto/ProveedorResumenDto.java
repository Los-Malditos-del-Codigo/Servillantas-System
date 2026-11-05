package com.servillantas.compras.dto;

import java.util.UUID;

public record ProveedorResumenDto(
    UUID id,
    String nombre,
    String ruc
) {}
