package com.servillantas.servicios.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class CrearMaterialRequestDto {

    @NotNull(message = "El productoId es obligatorio")
    private UUID productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    public CrearMaterialRequestDto() {
    }

    public CrearMaterialRequestDto(UUID productoId, BigDecimal cantidad) {
        this.productoId = productoId;
        this.cantidad = cantidad;
    }

    public UUID productoId() {
        return productoId;
    }

    public BigDecimal cantidad() {
        return cantidad;
    }

    public UUID getProductoId() {
        return productoId;
    }

    public void setProductoId(UUID productoId) {
        this.productoId = productoId;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }
}
