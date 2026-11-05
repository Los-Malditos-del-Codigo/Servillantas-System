package com.servillantas.asistente.dto;

import jakarta.validation.constraints.Size;

public record CrearConversacionRequestDto(
    @Size(max = 200, message = "El título no debe exceder 200 caracteres")
    String titulo
) {}

