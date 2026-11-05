package com.servillantas.rv.autenticacion.security.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.servillantas.rv.autenticacion.entity.Perfil;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

	private final SecretKey secretKey;

	private final long expiration;

	public JwtUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration}") long expiration) {

		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

		this.expiration = expiration;
	}

	public String generateToken(Perfil perfil) {

		Map<String, Object> claims = new HashMap<>();

		claims.put("rol", perfil.getRol().getNombre());

		claims.put("nombres", perfil.getNombres());

		Date ahora = new Date();

		Date expiracion = new Date(ahora.getTime() + expiration);

		return Jwts.builder().claims(claims).subject(perfil.getId().toString()).issuedAt(ahora).expiration(expiracion)
				.signWith(secretKey).compact();
	}

	public String extractPerfilId(String token) {

		return extractAllClaims(token).getSubject();
	}

	public String extractRol(String token) {

		return extractAllClaims(token).get("rol", String.class);
	}

	public boolean isTokenValid(String token) {

		try {

			extractAllClaims(token);

			return true;

		} catch (Exception e) {

			return false;
		}
	}

	public Claims extractAllClaims(String token) {

		return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
	}
}