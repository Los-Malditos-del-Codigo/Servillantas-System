package com.servillantas.compras.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CrearCompraItemDto(
    @NotNull(message = "El producto_id es obligatorio")
    @JsonAlias({"producto_id", "productoId"})
    UUID productoId,

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.001", message = "La cantidad debe ser mayor a 0")
    BigDecimal cantidad,

    @NotNull(message = "El costo unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    @JsonAlias({"costo_unitario", "costoUnitario", "precio_unitario", "precioUnitario"})
    BigDecimal costoUnitario
) {}
