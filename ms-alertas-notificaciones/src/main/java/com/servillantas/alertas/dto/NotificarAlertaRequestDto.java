package com.servillantas.alertas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record NotificarAlertaRequestDto(
    @NotNull(message = "El id de usuario es obligatorio")
    UUID usuarioId,

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 500, message = "El mensaje no debe exceder 500 caracteres")
    String mensaje
) {}

