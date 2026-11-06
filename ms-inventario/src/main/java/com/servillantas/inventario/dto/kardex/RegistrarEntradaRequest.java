package com.servillantas.inventario.dto.kardex;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record RegistrarEntradaRequest(

        @NotNull(message = "El producto es obligatorio")
        @JsonAlias({"producto_id", "productoId"})
        UUID productoId,

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.0", inclusive = false, message = "La cantidad debe ser mayor que cero")
        BigDecimal cantidad,

        @DecimalMin(value = "0.0", message = "El costo unitario no puede ser negativo")
        @JsonAlias({"costo_unitario", "costoUnitario"})
        BigDecimal costoUnitario,

        @Size(max = 180, message = "El proveedor no puede superar 180 caracteres")
        String proveedor,

        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 300, message = "El motivo no puede superar 300 caracteres")
        String motivo,

        @Size(max = 500, message = "Las observaciones no pueden superar 500 caracteres")
        String observaciones
) {
}
