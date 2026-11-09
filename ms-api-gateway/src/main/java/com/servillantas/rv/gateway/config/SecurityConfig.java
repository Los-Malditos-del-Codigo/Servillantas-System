package com.servillantas.rv.gateway.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.header.ReferrerPolicyServerHttpHeadersWriter;
import org.springframework.security.web.server.header.XFrameOptionsServerHttpHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import reactor.core.publisher.Flux;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final List<String> METODOS_PERMITIDOS = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    private static final List<String> HEADERS_PERMITIDOS = List.of(
            "Authorization",
            "Content-Type",
            "Idempotency-Key",
            "X-Correlation-Id",
            "X-Requested-With",
            "Accept",
            "Origin"
    );
    private static final List<String> HEADERS_EXPUESTOS = List.of(
            "X-Correlation-Id",
            "Content-Disposition",
            "Idempotent-Replayed"
    );

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                // CSRF deshabilitado para APIs REST stateless protegidas por JWT en cabecera Authorization
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())

                // Endurecimiento de cabeceras HTTP (OWASP / ISO 27001 / SOC 2)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; frame-ancestors 'none'; object-src 'none'"))
                        .frameOptions(frame -> frame
                                .mode(XFrameOptionsServerHttpHeadersWriter.Mode.DENY))
                        .hsts(hsts -> hsts
                                .maxAge(Duration.ofDays(365))
                                .includeSubdomains(true)
                                .preload(true))
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyServerHttpHeadersWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                )

                // Control de acceso y principio de mínimo privilegio (SOC 2 CC6.1 / OWASP API5)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/api/v1/auth/**").permitAll()
                        .pathMatchers("/error").permitAll()
                        .pathMatchers("/actuator/health/**", "/actuator/info").permitAll()

                        // Endpoints de catálogo, productos e inventario de solo lectura accesibles para consulta pública / frontend
                        .pathMatchers(HttpMethod.GET,
                                "/api/v1/categorias/**",
                                "/api/v1/marcas/**",
                                "/api/v1/unidades-medida/**",
                                "/api/v1/productos/**",
                                "/api/v1/inventarios/**",
                                "/api/v1/inventario/**",
                                "/api/v1/proveedores/**",
                                "/api/v1/tipos-servicio/**"
                        ).permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/productos/**").hasAnyRole("PROPIETARIO", "PERSONAL")
                        .pathMatchers(HttpMethod.PUT, "/api/v1/productos/**").hasAnyRole("PROPIETARIO", "PERSONAL")
                        .pathMatchers(HttpMethod.DELETE, "/api/v1/productos/**").hasAnyRole("PROPIETARIO", "PERSONAL")
                        .pathMatchers("/api/v1/categorias/**", "/api/v1/marcas/**", "/api/v1/unidades-medida/**")
                            .hasAnyRole("PROPIETARIO", "PERSONAL")

                        // Resto de operaciones de la API requieren token JWT válido
                        .pathMatchers("/api/v1/**").authenticated()
                        .anyExchange().authenticated())

                // Validación de JWT como Resource Server OAuth2
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder(@Value("${jwt.secret:dGVzdC1zZWNyZXQta2V5LXNob3VsZC1iZS12ZXJ5LWxvbmctYW5kLXNlY3VyZS0yNTYtYml0cw==}") String secret) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        SecretKey secretKey = new SecretKeySpec(secretBytes, "HmacSHA512");
        return NimbusReactiveJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS512)
                .build();
    }

    @Bean
    public ReactiveJwtAuthenticationConverter jwtAuthenticationConverter() {
        ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String rol = jwt.getClaimAsString("rol");
            if (rol == null || rol.isBlank()) {
                return Flux.empty();
            }
            return Flux.just(new SimpleGrantedAuthority("ROLE_" + rol.trim().toUpperCase()));
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:4200}") String allowedOriginsStr) {

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*");
        configuration.setAllowedMethods(METODOS_PERMITIDOS);
        configuration.setAllowedHeaders(HEADERS_PERMITIDOS);
        configuration.setExposedHeaders(HEADERS_EXPUESTOS);
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
