package com.servillantas.ventas.client;

public interface InventarioClient {

    /**
     * Registra una salida de stock en MS-Inventario.
     * @param request Datos del movimiento
     * @param idempotencyKey Clave de idempotencia única y determinística
     * @param correlationId Identificador de correlación para trazabilidad
     */
    void registrarSalida(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);

    /**
     * Registra una entrada de stock en MS-Inventario (p. ej. reintegro por anulación de venta).
     * @param request Datos del movimiento
     * @param idempotencyKey Clave de idempotencia única y determinística
     * @param correlationId Identificador de correlación para trazabilidad
     */
    void registrarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);

    /**
     * Compensa registrando una entrada de stock tras un fallo o aborto de operación.
     * @param request Datos del movimiento compensatorio (motivo: "Reversión por operación fallida")
     * @param idempotencyKey Clave de idempotencia determinística de compensación
     * @param correlationId Identificador de correlación
     */
    void compensarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);
}
