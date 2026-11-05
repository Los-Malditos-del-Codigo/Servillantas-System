package com.servillantas.producto.dto.marca;

import java.util.UUID;

public record MarcaResponse(

        UUID id,
        String nombre,
        String descripcion,
        Boolean activo
) {
}