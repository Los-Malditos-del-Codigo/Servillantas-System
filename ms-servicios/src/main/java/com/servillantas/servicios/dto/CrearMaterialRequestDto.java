package com.servillantas.servicios.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CrearMaterialRequestDto(
    @NotNull(message = "El productoId es obligatorio")
    @JsonAlias({"productoId", "producto_id"})
    UUID productoId,

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    BigDecimal cantidad
) {}
