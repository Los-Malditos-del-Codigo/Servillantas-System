package com.servillantas.servicios.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CrearServicioRequestDto(
    @NotNull(message = "El tipoServicioId es obligatorio")
    @JsonAlias({"tipoServicioId", "tipo_servicio_id"})
    UUID tipoServicioId,

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio debe ser mayor o igual a 0")
    BigDecimal precio,

    OffsetDateTime fecha,
    String observacion
) {}
