package com.servillantas.inventario.security;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Base64;

/**
 * Extrae la identidad del usuario a partir del token Bearer.
 *
 * El gateway (ms-api-gateway) ya validó la firma del JWT antes de enrutar la
 * petición, por lo que aquí solo se decodifica el payload para leer los claims
 * "sub" (id del perfil) y "nombres". No se vuelve a verificar la firma.
 */
@Component
public class JwtUsuarioResolver {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public Usuario resolver(String authorizationHeader) {
        String token = extraerToken(authorizationHeader);
        if (token == null) {
            return Usuario.sistema();
        }
        try {
            String[] partes = token.split("\\.");
            if (partes.length < 2) {
                return Usuario.sistema();
            }
            byte[] payload = Base64.getUrlDecoder().decode(conPadding(partes[1]));
            JsonNode claims = MAPPER.readTree(payload);

            JsonNode idNode = claims.get("sub");
            String id = idNode != null && !idNode.isNull() ? idNode.asString() : null;
            JsonNode nombresNode = claims.get("nombres");
            String nombres = nombresNode != null && !nombresNode.isNull()
                    ? nombresNode.asString("").trim() : null;
            if (nombres == null || nombres.isEmpty()) {
                nombres = "Sistema";
            }
            return new Usuario(id, nombres);
        } catch (Exception ex) {
            return Usuario.sistema();
        }
    }

    private String extraerToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7).trim();
    }

    private String conPadding(String valor) {
        int resto = valor.length() % 4;
        return switch (resto) {
            case 2 -> valor + "==";
            case 3 -> valor + "=";
            default -> valor;
        };
    }

    public record Usuario(String id, String nombres) {
        public static Usuario sistema() {
            return new Usuario(null, "Sistema");
        }
    }
}
