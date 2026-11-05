package com.servillantas.rv.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Filtro de seguridad y trazabilidad (OWASP API1, SOC 2 CC6.1, ISO 27001 A.8.20).
 * 1. Sanitiza cualquier cabecera de identidad enviada por clientes externos para evitar suplantación (spoofing).
 * 2. Propaga de forma segura el identificador y rol del usuario autenticado obtenido del token JWT validado.
 * 3. Genera o propaga X-Correlation-Id para trazabilidad auditada de extremo a extremo.
 */
@Component
public class UsuarioHeaderFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(UsuarioHeaderFilter.class);

    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_EMAIL = "X-User-Email";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 1. Manejo de X-Correlation-Id para trazabilidad distribuida
        String correlationId = request.getHeaders().getFirst(HEADER_CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        final String activeCorrelationId = correlationId;

        // Añadir correlationId a los headers de la respuesta
        exchange.getResponse().getHeaders().set(HEADER_CORRELATION_ID, activeCorrelationId);

        // 2. Extraer contexto de seguridad si existe JWT autenticado
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .filter(JwtAuthenticationToken.class::isInstance)
                .cast(JwtAuthenticationToken.class)
                .map(JwtAuthenticationToken::getToken)
                .map(jwt -> sanitizeAndInjectHeaders(exchange, jwt, activeCorrelationId))
                .defaultIfEmpty(sanitizeWithoutAuth(exchange, activeCorrelationId))
                .flatMap(chain::filter);
    }

    private ServerWebExchange sanitizeAndInjectHeaders(ServerWebExchange exchange, Jwt jwt, String correlationId) {
        String subject = jwt.getSubject();
        String rol = jwt.getClaimAsString("rol");
        String email = jwt.getClaimAsString("email");

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    // Sanitizar cabeceras prevenientes del exterior
                    headers.remove(HEADER_USER_ID);
                    headers.remove(HEADER_USER_ROLE);
                    headers.remove(HEADER_USER_EMAIL);

                    // Inyectar valores validados por el Gateway
                    headers.set(HEADER_CORRELATION_ID, correlationId);
                    if (subject != null && !subject.isBlank()) {
                        headers.set(HEADER_USER_ID, subject.trim());
                    }
                    if (rol != null && !rol.isBlank()) {
                        headers.set(HEADER_USER_ROLE, rol.trim());
                    }
                    if (email != null && !email.isBlank()) {
                        headers.set(HEADER_USER_EMAIL, email.trim());
                    }
                })
                .build();

        return exchange.mutate().request(mutatedRequest).build();
    }

    private ServerWebExchange sanitizeWithoutAuth(ServerWebExchange exchange, String correlationId) {
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    // Sanitizar siempre para evitar inyección de identidad no autorizada
                    headers.remove(HEADER_USER_ID);
                    headers.remove(HEADER_USER_ROLE);
                    headers.remove(HEADER_USER_EMAIL);
                    headers.set(HEADER_CORRELATION_ID, correlationId);
                })
                .build();

        return exchange.mutate().request(mutatedRequest).build();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
