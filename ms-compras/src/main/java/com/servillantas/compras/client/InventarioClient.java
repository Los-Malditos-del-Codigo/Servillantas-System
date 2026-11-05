package com.servillantas.compras.client;

public interface InventarioClient {

    /**
     * Registra una entrada de stock en MS-Inventario al confirmar la recepción de una compra.
     *
     * @param request Datos del movimiento de entrada (producto, cantidad, referencia)
     * @param idempotencyKey Clave determinística por compra y detalle para garantizar idempotencia
     * @param correlationId Identificador de correlación para trazabilidad
     */
    void registrarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);
}
