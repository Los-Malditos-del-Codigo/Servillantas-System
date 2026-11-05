package com.servillantas.producto.dto.producto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductoResponse(

        UUID id,
        String codigo,
        String nombre,
        String descripcion,
        UUID categoriaId,
        String categoriaNombre,
        UUID marcaId,
        String marcaNombre,
        UUID unidadMedidaId,
        String unidadMedidaNombre,
        String unidadMedidaAbreviatura,
        BigDecimal precioVenta,
        BigDecimal stockMinimo,
        Boolean activo,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}