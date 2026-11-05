package com.servillantas.rv.autenticacion.security.jwt;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtUtil jwtUtil;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String authorizationHeader = request.getHeader("Authorization");

		if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {

			filterChain.doFilter(request, response);

			return;
		}

		String token = authorizationHeader.substring(7);

		try {

			if (jwtUtil.isTokenValid(token) && SecurityContextHolder.getContext().getAuthentication() == null) {

				String perfilId = jwtUtil.extractPerfilId(token);

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(perfilId,
						null, Collections.emptyList());

				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

				SecurityContextHolder.getContext().setAuthentication(authentication);
			}

		} catch (Exception exception) {

			SecurityContextHolder.clearContext();
		}

		filterChain.doFilter(request, response);
	}
}