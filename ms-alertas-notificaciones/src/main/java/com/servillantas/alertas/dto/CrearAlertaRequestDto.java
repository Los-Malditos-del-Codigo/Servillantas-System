package com.servillantas.alertas.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CrearAlertaRequestDto(
    @NotNull(message = "El id de producto es obligatorio")
    @JsonAlias({"producto_id", "productoId"})
    UUID productoId,

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 500, message = "El mensaje no debe exceder 500 caracteres")
    String mensaje
) {}

