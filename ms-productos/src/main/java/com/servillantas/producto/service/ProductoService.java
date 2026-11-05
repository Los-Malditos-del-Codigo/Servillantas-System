package com.servillantas.producto.service;

import com.servillantas.producto.dto.producto.ProductoRequest;
import com.servillantas.producto.dto.producto.ProductoResponse;

import java.util.List;
import java.util.UUID;

public interface ProductoService {

    ProductoResponse crear(ProductoRequest request);

    ProductoResponse obtenerPorId(UUID id);

    List<ProductoResponse> obtenerTodos(
            String search,
            UUID categoriaId,
            UUID marcaId,
            boolean includeInactivos
    );

    ProductoResponse actualizar(UUID id, ProductoRequest request);

    ProductoResponse toggleActivo(UUID id);

    void eliminar(UUID id);
}