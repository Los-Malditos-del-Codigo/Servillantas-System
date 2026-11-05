package com.servillantas.producto.service;

import com.servillantas.producto.dto.unidadmedida.UnidadMedidaRequest;
import com.servillantas.producto.dto.unidadmedida.UnidadMedidaResponse;

import java.util.List;
import java.util.UUID;

public interface UnidadMedidaService {

    UnidadMedidaResponse crear(UnidadMedidaRequest request);

    UnidadMedidaResponse obtenerPorId(UUID id);

    List<UnidadMedidaResponse> obtenerTodos();

    UnidadMedidaResponse actualizar(
            UUID id,
            UnidadMedidaRequest request
    );

    UnidadMedidaResponse toggleActivo(UUID id);

    void eliminar(UUID id);
}
