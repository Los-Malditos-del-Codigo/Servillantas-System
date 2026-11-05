package com.servillantas.servicios.exception;

import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.util.UUID;

public class StockInsuficienteException extends BaseApiException {

    private final UUID productoId;
    private final BigDecimal stockDisponible;

    public StockInsuficienteException(String message, UUID productoId, BigDecimal stockDisponible) {
        super(message, "STOCK_INSUFICIENTE", HttpStatus.CONFLICT);
        this.productoId = productoId;
        this.stockDisponible = stockDisponible;
    }

    public UUID getProductoId() {
        return productoId;
    }

    public BigDecimal getStockDisponible() {
        return stockDisponible;
    }
}
