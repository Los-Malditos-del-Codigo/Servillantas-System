package com.servillantas.inventario.service;

import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioRequest;
import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioResponse;

import java.util.List;
import java.util.UUID;

public interface AjusteInventarioService {

    AjusteInventarioResponse crear(AjusteInventarioRequest request);

    AjusteInventarioResponse obtenerPorId(UUID id);

    List<AjusteInventarioResponse> obtenerTodos();

    List<AjusteInventarioResponse> obtenerPorProductoId(UUID productoId);

    List<AjusteInventarioResponse> obtenerPorUsuarioId(UUID usuarioId);

}
