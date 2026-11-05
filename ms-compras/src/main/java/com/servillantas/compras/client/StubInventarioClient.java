package com.servillantas.compras.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "inventario.stub", havingValue = "true")
public class StubInventarioClient implements InventarioClient {

    private static final Logger log = LoggerFactory.getLogger(StubInventarioClient.class);

    @Override
    public void registrarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId) {
        log.info("[STUB MS-Inventario] Registrando entrada de producto {} cantidad {} idempotencyKey {} correlationId {}",
                request.productoId(), request.cantidad(), idempotencyKey, correlationId);
    }
}
