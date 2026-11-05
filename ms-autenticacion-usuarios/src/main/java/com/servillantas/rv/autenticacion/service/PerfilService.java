package com.servillantas.rv.autenticacion.service;

import java.util.UUID;

import com.servillantas.rv.autenticacion.dto.perfil.PerfilRequest;
import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;

public interface PerfilService {

    PerfilResponse crear(PerfilRequest request);

    PerfilResponse obtenerPorId(UUID id);
}
