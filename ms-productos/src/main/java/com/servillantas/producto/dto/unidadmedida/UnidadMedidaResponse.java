package com.servillantas.producto.dto.unidadmedida;

import java.util.UUID;

public record UnidadMedidaResponse(

        UUID id,
        String nombre,
        String abreviatura,
        Boolean activo
) {
}