package com.servillantas.inventario.service;

import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioRequest;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioResponse;
import com.servillantas.inventario.entity.AjusteInventario;

import java.util.List;
import java.util.UUID;

public interface MovimientoInventarioService {

    MovimientoInventarioResponse registrar(MovimientoInventarioRequest request);

    MovimientoInventarioResponse registrarAjuste(AjusteInventario ajuste);

    MovimientoInventarioResponse obtenerPorId(UUID id);

    List<MovimientoInventarioResponse> obtenerTodos();

    List<MovimientoInventarioResponse> obtenerPorProducto(UUID productoId);

    List<MovimientoInventarioResponse> obtenerPorProductoYTipo(UUID productoId, String tipo);
}
