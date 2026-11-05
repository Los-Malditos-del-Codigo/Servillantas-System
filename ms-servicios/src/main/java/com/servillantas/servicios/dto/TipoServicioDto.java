package com.servillantas.servicios.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TipoServicioDto(
    UUID id,
    String nombre,
    String descripcion,
    BigDecimal precioReferencial,
    Boolean activo
) {}
