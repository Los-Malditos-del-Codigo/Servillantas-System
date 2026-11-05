package com.servillantas.inventario;

import com.servillantas.inventario.dto.kardex.InventarioStockResponse;
import com.servillantas.inventario.dto.kardex.MovimientoKardexResponse;
import com.servillantas.inventario.dto.kardex.RegistrarEntradaRequest;
import com.servillantas.inventario.security.JwtUsuarioResolver;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica el contrato JSON esperado por el frontend sin necesitar base de datos.
 * Los responses deben ser snake_case y los requests aceptar camelCase.
 */
class DtoJsonContractTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void inventarioStockResponseSerializaSnakeCase() throws Exception {
        OffsetDateTime ahora = OffsetDateTime.parse("2026-01-01T10:00:00Z");
        InventarioStockResponse response = new InventarioStockResponse(
                UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("5.000"), ahora, ahora, ahora);

        String json = mapper.writeValueAsString(response);

        assertThat(json)
                .contains("\"producto_id\"")
                .contains("\"stock_actual\"")
                .contains("\"ultima_actualizacion\"")
                .contains("\"created_at\"")
                .contains("\"updated_at\"");
    }

    @Test
    void movimientoKardexResponseSerializaSnakeCase() throws Exception {
        MovimientoKardexResponse response = new MovimientoKardexResponse(
                UUID.randomUUID(), UUID.randomUUID(), "entrada", new BigDecimal("3.000"),
                new BigDecimal("1.000"), new BigDecimal("4.000"), null, "Compra", null,
                "Juan Perez", OffsetDateTime.parse("2026-01-01T10:00:00Z"));

        String json = mapper.writeValueAsString(response);

        assertThat(json)
                .contains("\"producto_id\"")
                .contains("\"stock_anterior\"")
                .contains("\"stock_posterior\"")
                .contains("\"costo_unitario\"")
                .contains("\"registrado_por\"")
                .contains("\"created_at\"");
    }

    @Test
    void registrarEntradaRequestAceptaCamelCase() throws Exception {
        UUID productoId = UUID.randomUUID();
        String json = "{\"productoId\":\"" + productoId + "\",\"cantidad\":3,"
                + "\"costoUnitario\":12.5,\"proveedor\":\"ACME\",\"motivo\":\"Compra\","
                + "\"observaciones\":\"ok\"}";

        RegistrarEntradaRequest request = mapper.readValue(json, RegistrarEntradaRequest.class);

        assertThat(request.productoId()).isEqualTo(productoId);
        assertThat(request.cantidad()).isEqualByComparingTo("3");
        assertThat(request.costoUnitario()).isEqualByComparingTo("12.5");
        assertThat(request.motivo()).isEqualTo("Compra");
    }

    @Test
    void jwtUsuarioResolverExtraeSubYNombres() {
        UUID perfilId = UUID.randomUUID();
        String payload = "{\"sub\":\"" + perfilId + "\",\"rol\":\"PROPIETARIO\",\"nombres\":\"Juan Perez\"}";
        String token = "header." + Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + ".firma";

        JwtUsuarioResolver.Usuario usuario = new JwtUsuarioResolver().resolver("Bearer " + token);

        assertThat(usuario.id()).isEqualTo(perfilId.toString());
        assertThat(usuario.nombres()).isEqualTo("Juan Perez");
    }

    @Test
    void jwtUsuarioResolverSinTokenDevuelveSistema() {
        JwtUsuarioResolver.Usuario usuario = new JwtUsuarioResolver().resolver(null);

        assertThat(usuario.id()).isNull();
        assertThat(usuario.nombres()).isEqualTo("Sistema");
    }
}
