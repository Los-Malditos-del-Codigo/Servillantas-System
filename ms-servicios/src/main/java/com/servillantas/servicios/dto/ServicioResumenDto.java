package com.servillantas.servicios.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ServicioResumenDto(
    UUID id,
    OffsetDateTime fecha,
    UUID tipoServicioId,
    String tipoServicioNombre,
    BigDecimal precio,
    String estado,
    String observacion,
    int cantidadMateriales
) {}
