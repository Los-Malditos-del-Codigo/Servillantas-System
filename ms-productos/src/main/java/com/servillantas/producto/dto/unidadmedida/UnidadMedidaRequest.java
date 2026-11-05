package com.servillantas.producto.dto.unidadmedida;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UnidadMedidaRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,

        @NotBlank(message = "La abreviatura es obligatoria")
        @Size(max = 20, message = "La abreviatura no puede superar los 20 caracteres")
        String abreviatura,

        Boolean activo
) {
}