package com.servillantas.inventario.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

/**
 * Consulta ms-autenticacion para resolver el nombre del usuario que registró
 * un movimiento. Reenvía el header Authorization original para que el otro
 * microservicio valide el JWT. Es resiliente: ante cualquier error devuelve vacío.
 */
@Component
public class AutenticacionClient {

    private final RestClient restClient;

    public AutenticacionClient(@Value("${app.autenticacion.base-url:http://localhost:8080}") String baseUrl) {
        this.restClient = RestClient.create(baseUrl);
    }

    public Optional<PerfilInfo> obtener(UUID perfilId, String authorization) {
        if (perfilId == null) {
            return Optional.empty();
        }
        try {
            PerfilInfo info = restClient.get()
                    .uri("/api/v1/perfiles/{id}", perfilId)
                    .headers(headers -> {
                        if (authorization != null && !authorization.isBlank()) {
                            headers.set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    })
                    .retrieve()
                    .body(PerfilInfo.class);
            return Optional.ofNullable(info);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PerfilInfo(
            UUID id,
            String nombres,
            String apellidos
    ) {
    }
}
