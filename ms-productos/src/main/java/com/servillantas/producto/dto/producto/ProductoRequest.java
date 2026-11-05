package com.servillantas.producto.dto.producto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductoRequest(

        @NotBlank(message = "El código es obligatorio")
        @Size(max = 50, message = "El código no puede superar los 50 caracteres")
        String codigo,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
        String nombre,

        String descripcion,

        @NotNull(message = "La categoría es obligatoria")
        UUID categoriaId,

        UUID marcaId,

        @NotNull(message = "La unidad de medida es obligatoria")
        UUID unidadMedidaId,

        @NotNull(message = "El precio de venta es obligatorio")
        @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El precio debe tener máximo 2 decimales")
        BigDecimal precioVenta,

        @NotNull(message = "El stock mínimo es obligatorio")
        @DecimalMin(value = "0.0", inclusive = true, message = "El stock mínimo no puede ser negativo")
        @Digits(integer = 11, fraction = 3, message = "El stock mínimo debe tener máximo 3 decimales")
        BigDecimal stockMinimo,

        Boolean activo
) {
}