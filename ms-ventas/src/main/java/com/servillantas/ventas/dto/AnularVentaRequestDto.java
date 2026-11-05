package com.servillantas.ventas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnularVentaRequestDto(
    @NotBlank(message = "El motivo de anulación es obligatorio")
    @Size(max = 500, message = "El motivo no puede exceder 500 caracteres")
    String motivo
) {}
