package com.servillantas.producto.dto.categoria;

import java.util.UUID;

public record CategoriaResponse(

        UUID id,
        String nombre,
        String descripcion,
        Boolean activo
) {
}