package com.servillantas.inventario.dto.inventario;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record InventarioRequest(
        @NotNull(message = "El producto es obligatorio")
        UUID productoId,

        @NotNull(message = "El stock actual es obligatorio")
        @DecimalMin(value = "0.0", message = "El stock no puede ser negativo")
        BigDecimal stockActual
) {
}
