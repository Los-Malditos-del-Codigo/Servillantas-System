package com.servillantas.rv.autenticacion.service.impl;

import org.springframework.stereotype.Service;

import com.servillantas.rv.autenticacion.entity.Perfil;
import com.servillantas.rv.autenticacion.security.jwt.JwtUtil;
import com.servillantas.rv.autenticacion.service.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {

	private final JwtUtil jwtUtil;

	@Override
	public String generateToken(Perfil perfil) {

		return jwtUtil.generateToken(perfil);
	}

	@Override
	public String extractPerfilId(String token) {

		return jwtUtil.extractPerfilId(token);
	}

	@Override
	public boolean isTokenValid(String token) {

		return jwtUtil.isTokenValid(token);
	}

}
