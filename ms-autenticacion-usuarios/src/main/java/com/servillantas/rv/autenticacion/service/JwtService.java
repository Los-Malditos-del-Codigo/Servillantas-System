package com.servillantas.rv.autenticacion.service;

import com.servillantas.rv.autenticacion.entity.Perfil;

public interface JwtService {

    String generateToken(Perfil perfil);

    String extractPerfilId(String token);

    boolean isTokenValid(String token);
}