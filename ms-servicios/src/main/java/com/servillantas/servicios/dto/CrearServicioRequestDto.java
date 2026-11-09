package com.servillantas.servicios.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class CrearServicioRequestDto {

    @NotNull(message = "El tipoServicioId es obligatorio")
    private UUID tipoServicioId;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio debe ser mayor o igual a 0")
    private BigDecimal precio;

    private OffsetDateTime fecha;
    private String observacion;

    public CrearServicioRequestDto() {
    }

    public CrearServicioRequestDto(UUID tipoServicioId, BigDecimal precio, OffsetDateTime fecha, String observacion) {
        this.tipoServicioId = tipoServicioId;
        this.precio = precio;
        this.fecha = fecha;
        this.observacion = observacion;
    }

    public UUID tipoServicioId() {
        return tipoServicioId;
    }

    public BigDecimal precio() {
        return precio;
    }

    public OffsetDateTime fecha() {
        return fecha;
    }

    public String observacion() {
        return observacion;
    }

    public UUID getTipoServicioId() {
        return tipoServicioId;
    }

    public void setTipoServicioId(UUID tipoServicioId) {
        this.tipoServicioId = tipoServicioId;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public OffsetDateTime getFecha() {
        return fecha;
    }

    public void setFecha(OffsetDateTime fecha) {
        this.fecha = fecha;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
}
