package com.servillantas.producto.dto.marca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarcaRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,

        String descripcion,
        Boolean activo
) {
}