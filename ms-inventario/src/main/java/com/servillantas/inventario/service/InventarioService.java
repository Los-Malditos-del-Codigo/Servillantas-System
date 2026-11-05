package com.servillantas.inventario.service;

import com.servillantas.inventario.dto.inventario.InventarioRequest;
import com.servillantas.inventario.dto.inventario.InventarioResponse;

import java.util.List;
import java.util.UUID;

public interface InventarioService {

    InventarioResponse crear(InventarioRequest request);

    InventarioResponse obtenerPorId(UUID id);

    InventarioResponse obtenerPorProductoId(UUID productoId);

    List<InventarioResponse> obtenerTodos();

}
