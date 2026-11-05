package com.servillantas.servicios.client;

public interface InventarioClient {

    /**
     * Registra una salida de materiales en MS-Inventario con clave determinística.
     */
    void registrarSalida(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);

    /**
     * Registra una entrada de materiales en MS-Inventario (p. ej. reintegro por anulación de servicio).
     */
    void registrarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId);
}
