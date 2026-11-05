package com.servillantas.compras.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnularCompraRequestDto(
    @NotBlank(message = "El motivo de anulación es obligatorio")
    @Size(max = 500, message = "El motivo no puede exceder 500 caracteres")
    String motivo
) {}
