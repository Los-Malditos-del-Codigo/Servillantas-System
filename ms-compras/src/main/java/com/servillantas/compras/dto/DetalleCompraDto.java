package com.servillantas.compras.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DetalleCompraDto(
    UUID id,
    UUID productoId,
    BigDecimal cantidad,
    BigDecimal costoUnitario,
    BigDecimal subtotal
) {}
