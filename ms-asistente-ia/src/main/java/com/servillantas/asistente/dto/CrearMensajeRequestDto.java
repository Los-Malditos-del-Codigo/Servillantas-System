package com.servillantas.asistente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CrearMensajeRequestDto(
    @NotBlank(message = "El rol de mensaje es obligatorio")
    @Pattern(regexp = "(?i)USER|ASSISTANT|SYSTEM", message = "El rol debe ser USER, ASSISTANT o SYSTEM")
    String rolMensaje,

    @NotBlank(message = "El contenido no puede estar vacío")
    String contenido
) {}

