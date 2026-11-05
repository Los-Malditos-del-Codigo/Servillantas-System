package com.servillantas.rv.autenticacion.dto.auth;

import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;
import com.servillantas.rv.autenticacion.entity.Rol;

public record LoginResponse(

		String token,

		String tokenType,

		PerfilResponse perfil,

		Rol rol

) {
}