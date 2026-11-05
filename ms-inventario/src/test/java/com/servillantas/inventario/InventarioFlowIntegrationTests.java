package com.servillantas.inventario;

import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioRequest;
import com.servillantas.inventario.dto.inventario.InventarioResponse;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioRequest;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioResponse;
import com.servillantas.inventario.exception.BusinessRuleException;
import com.servillantas.inventario.service.AjusteInventarioService;
import com.servillantas.inventario.service.InventarioService;
import com.servillantas.inventario.service.MovimientoInventarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class InventarioFlowIntegrationTests {

    @Autowired
    private MovimientoInventarioService movimientoInventarioService;

    @Autowired
    private AjusteInventarioService ajusteInventarioService;

    @Autowired
    private InventarioService inventarioService;

    @Test
    void entradaActualizaElStockYRegistraElKardex() {
        UUID productoId = UUID.randomUUID();

        MovimientoInventarioResponse movimiento = movimientoInventarioService.registrar(
                movimiento(productoId, "ENTRADA", "MANUAL", "5.000", "entrada-1")
        );

        InventarioResponse inventario = inventarioService.obtenerPorProductoId(productoId);
        assertThat(movimiento.stockAnterior()).isEqualByComparingTo("0.000");
        assertThat(movimiento.stockResultante()).isEqualByComparingTo("5.000");
        assertThat(inventario.stockActual()).isEqualByComparingTo("5.000");
    }

    @Test
    void salidaSinStockDisponibleEsRechazada() {
        UUID productoId = UUID.randomUUID();

        assertThatThrownBy(() -> movimientoInventarioService.registrar(
                movimiento(productoId, "SALIDA", "MANUAL", "1.000", "salida-1")
        )).isInstanceOf(BusinessRuleException.class)
                .hasMessage("Stock insuficiente para realizar la salida");
    }

    @Test
    void ajusteRegistraMovimientoYActualizaElStock() {
        UUID productoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();

        ajusteInventarioService.crear(new AjusteInventarioRequest(
                productoId,
                usuarioId,
                "AJUSTE_POSITIVO",
                new BigDecimal("3.000"),
                "Conteo físico",
                null,
                "ajuste-1"
        ));

        InventarioResponse inventario = inventarioService.obtenerPorProductoId(productoId);
        assertThat(inventario.stockActual()).isEqualByComparingTo("3.000");
    }

    private MovimientoInventarioRequest movimiento(
            UUID productoId,
            String tipo,
            String origen,
            String cantidad,
            String idempotencyKey
    ) {
        return new MovimientoInventarioRequest(
                productoId,
                null,
                tipo,
                new BigDecimal(cantidad),
                origen,
                null,
                idempotencyKey,
                null,
                null
        );
    }
}
