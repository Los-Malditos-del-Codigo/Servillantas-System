package com.servillantas.inventario.dto.ajusteinventario;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record AjusteInventarioRequest(
        @NotNull(message = "El producto es obligatorio")
        UUID productoId,
        @NotNull(message = "El usuario es obligatorio")
        UUID usuarioId,
        @NotBlank(message = "El tipo es obligatorio")
        @Pattern(regexp = "AJUSTE_POSITIVO|AJUSTE_NEGATIVO", message = "Tipo de ajuste inválido")
        String tipo,
        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.0", inclusive = false, message = "La cantidad debe ser mayor que cero")
        BigDecimal cantidad,
        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 300, message = "El motivo no puede superar 300 caracteres")
        String motivo,
        String observacion,
        @Size(max = 120, message = "La clave de idempotencia no puede superar 120 caracteres")
        String idempotencyKey
) {
}
