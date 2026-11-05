package com.servillantas.producto.service;

import com.servillantas.producto.dto.categoria.CategoriaRequest;
import com.servillantas.producto.dto.categoria.CategoriaResponse;

import java.util.List;
import java.util.UUID;

public interface CategoriaService {

    CategoriaResponse crear(CategoriaRequest request);

    CategoriaResponse obtenerPorId(UUID id);

    List<CategoriaResponse> obtenerTodos();

    CategoriaResponse actualizar(UUID id, CategoriaRequest request);

    CategoriaResponse toggleActivo(UUID id);

    void eliminar(UUID id);
}