package com.servillantas.producto.service;

import com.servillantas.producto.dto.marca.MarcaRequest;
import com.servillantas.producto.dto.marca.MarcaResponse;

import java.util.List;
import java.util.UUID;

public interface MarcaService {

    MarcaResponse crear(MarcaRequest request);

    MarcaResponse obtenerPorId(UUID id);

    List<MarcaResponse> obtenerTodos();

    MarcaResponse actualizar(UUID id, MarcaRequest request);

    MarcaResponse toggleActivo(UUID id);

    void eliminar(UUID id);
}