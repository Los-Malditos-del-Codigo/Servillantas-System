package com.servillantas.reportes.config;

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

@Component
public class UsuarioActualProvider {

    private static final Logger log = LoggerFactory.getLogger(UsuarioActualProvider.class);
    public static final String HEADER_USER_ID = "X-User-Id";

    @Value("${app.auth.default-user-id:00000000-0000-0000-0000-000000000001}")
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

