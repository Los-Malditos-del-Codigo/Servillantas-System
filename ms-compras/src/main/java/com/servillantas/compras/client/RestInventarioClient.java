package com.servillantas.compras.client;

import com.servillantas.compras.config.UsuarioActualProvider;
import com.servillantas.compras.exception.InventarioNoDisponibleException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;

@Component
@ConditionalOnProperty(name = "inventario.stub", havingValue = "false", matchIfMissing = true)
public class RestInventarioClient implements InventarioClient {

    private static final Logger log = LoggerFactory.getLogger(RestInventarioClient.class);

    private final RestClient restClient;

    public RestInventarioClient(@Value("${inventario.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    @Override
    public void registrarEntrada(MovimientoInventarioRequest request, String idempotencyKey, String correlationId) {
        ejecutarConReintento(() -> {
            restClient.post()
                    .uri("/api/v1/inventario/entradas")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> poblarCabeceras(headers, idempotencyKey, correlationId))
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        }, request, "entrada de compra");
    }

    private void ejecutarConReintento(Runnable accion, MovimientoInventarioRequest req, String operacion) {
        int maxIntentos = 2;
        for (int intento = 1; intento <= maxIntentos; intento++) {
            try {
                accion.run();
                return;
            } catch (RestClientResponseException ex) {
                HttpStatusCode status = ex.getStatusCode();
                log.warn("MS-Inventario respondió con estado {} en intento {} para {}", status, intento, operacion);

                if (status.is5xxServerError() && intento < maxIntentos) {
                    log.info("Reintentando petición a MS-Inventario tras 5xx...");
                    continue;
                }

                if (status.is5xxServerError()) {
                    throw new InventarioNoDisponibleException("MS-Inventario no disponible (error 5xx). Por favor intente más tarde.");
                }
                throw ex;
            } catch (ResourceAccessException ex) {
                log.warn("Error de conexión/timeout con MS-Inventario en intento {}: {}", intento, ex.getMessage());
                if (intento < maxIntentos) {
                    log.info("Reintentando petición a MS-Inventario tras timeout...");
                    continue;
                }
                throw new InventarioNoDisponibleException("MS-Inventario no responde (timeout o no disponible). Reintente.");
            }
        }
    }

    private void poblarCabeceras(HttpHeaders headers, String idempotencyKey, String correlationId) {
        if (idempotencyKey != null) {
            headers.set("Idempotency-Key", idempotencyKey);
        }
        if (correlationId != null) {
            headers.set("X-Correlation-Id", correlationId);
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest currentRequest = attributes.getRequest();
            String authHeader = currentRequest.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && !authHeader.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, authHeader);
            }
            String userHeader = currentRequest.getHeader(UsuarioActualProvider.HEADER_USER_ID);
            if (userHeader != null && !userHeader.isBlank()) {
                headers.set(UsuarioActualProvider.HEADER_USER_ID, userHeader);
            }
        }
    }
}
