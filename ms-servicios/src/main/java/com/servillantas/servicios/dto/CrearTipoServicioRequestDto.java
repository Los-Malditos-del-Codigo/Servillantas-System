package com.servillantas.servicios.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CrearTipoServicioRequestDto(
    @NotBlank(message = "El nombre del tipo de servicio es obligatorio")
    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    String nombre,

    @Size(max = 255, message = "La descripción no puede exceder 255 caracteres")
    String descripcion,

    @DecimalMin(value = "0.0", message = "El precio referencial debe ser mayor o igual a 0")
    @JsonAlias({"precioReferencial", "precio_referencial"})
    BigDecimal precioReferencial,

    Boolean activo
) {}
