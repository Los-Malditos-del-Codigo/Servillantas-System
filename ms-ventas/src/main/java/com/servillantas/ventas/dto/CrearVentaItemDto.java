package com.servillantas.ventas.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CrearVentaItemDto(
    @NotNull(message = "El productoId es obligatorio")
    @JsonAlias({"productoId", "producto_id"})
    UUID productoId,

    @NotNull(message = "La cantidad es obligatoria")
    BigDecimal cantidad,

    @NotNull(message = "El precioUnitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El precioUnitario debe ser mayor o igual a 0")
    @JsonAlias({"precioUnitario", "precio_unitario"})
    BigDecimal precioUnitario
) {}
