package com.servillantas.rv.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MsApiGatewayApplicationTests {

	@Autowired
	private RouteDefinitionLocator routes;

	@Test
	void contextLoads() {
		assertThat(routes.getRouteDefinitions().collectList().block())
				.extracting(route -> route.getId())
				.containsExactlyInAnyOrder(
						"ms-autenticacion", "ms-productos", "ms-inventario", "ms-compras",
						"ms-ventas", "ms-servicios", "ms-alertas-notificaciones", "ms-reportes", "ms-asistente-ia");
	}

}
