package com.servillantas.compras.config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Abstracción para obtener el usuario autenticado (típicamente propietario / admin en Compras).
 * Lee el header X-User-Id (UUID) inyectado por el API Gateway tras validar el JWT.
 * En entorno de desarrollo o pruebas aisladas, permite un defaultUserId configurable.
 */
@Component
public class UsuarioActualProvider {

    private static final Logger log = LoggerFactory.getLogger(UsuarioActualProvider.class);
    public static final String HEADER_USER_ID = "X-User-Id";

    @Value("${app.auth.default-user-id:35021bd0-6171-4b12-ad68-49250a1627f3}")
    private String defaultUserId;

    public UUID getUsuarioId() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String userIdHeader = request.getHeader(HEADER_USER_ID);
            if (userIdHeader != null && !userIdHeader.isBlank()) {
                try {
                    return UUID.fromString(userIdHeader.trim());
                } catch (IllegalArgumentException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato inválido de " + HEADER_USER_ID);
                }
            }
        }
        log.warn("Header {} no encontrado en la petición. Usando defaultUserId: {}", HEADER_USER_ID, defaultUserId);
        return UUID.fromString(defaultUserId);
    }
}
