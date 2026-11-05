package com.servillantas.rv.autenticacion.service;

import com.servillantas.rv.autenticacion.dto.auth.LoginRequest;
import com.servillantas.rv.autenticacion.dto.auth.LoginResponse;
import com.servillantas.rv.autenticacion.dto.auth.RegistroRequest;
import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;

public interface AuthService {

	LoginResponse login(LoginRequest request);

	PerfilResponse registrar(RegistroRequest request);
}
