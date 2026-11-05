package com.servillantas.ventas.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DetalleVentaDto(
    UUID id,
    UUID productoId,
    BigDecimal cantidad,
    BigDecimal precioUnitario,
    BigDecimal subtotal
) {}
