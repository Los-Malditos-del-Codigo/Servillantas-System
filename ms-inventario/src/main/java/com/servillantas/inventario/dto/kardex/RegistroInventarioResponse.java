package com.servillantas.inventario.dto.kardex;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record RegistroInventarioResponse(
        MovimientoKardexResponse movimiento,
        InventarioStockResponse inventario
) {
}
