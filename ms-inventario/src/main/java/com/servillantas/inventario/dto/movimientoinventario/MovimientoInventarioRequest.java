package com.servillantas.inventario.dto.movimientoinventario;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record MovimientoInventarioRequest(
        @NotNull(message = "El producto es obligatorio")
        UUID productoId,

        UUID usuarioId,

        @NotBlank(message = "El tipo es obligatorio")
        @Pattern(regexp = "ENTRADA|SALIDA", message = "El tipo debe ser ENTRADA o SALIDA")
        String tipo,

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.0", message = "La cantidad no puede ser negativa")
        BigDecimal cantidad,

        @NotBlank(message = "El origen es obligatorio")
        @Size(max = 30, message = "El origen no puede superar 30 caracteres")
        String origen,

        UUID referenciaId,
        @Size(max = 120, message = "La clave de idempotencia no puede superar 120 caracteres")
        String idempotencyKey,
        UUID correlationId,
        @Size(max = 500, message = "La observación no puede superar 500 caracteres")
        String observacion
) {

    @AssertTrue(message = "La cantidad debe ser mayor que cero, salvo para un movimiento INICIAL de cantidad cero")
    public boolean isCantidadValida() {
        return cantidad != null && (cantidad.signum() > 0
                || ("INICIAL".equals(origen) && cantidad.signum() == 0));
    }
}
