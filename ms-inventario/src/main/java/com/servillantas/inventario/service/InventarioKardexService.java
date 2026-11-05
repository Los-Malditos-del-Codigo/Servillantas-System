package com.servillantas.inventario.service;


import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.servillantas.inventario.dto.kardex.InventarioStockResponse;
import com.servillantas.inventario.dto.kardex.MovimientoKardexResponse;
import com.servillantas.inventario.dto.kardex.RegistrarEntradaRequest;
import com.servillantas.inventario.dto.kardex.RegistrarSalidaRequest;
import com.servillantas.inventario.dto.kardex.RegistroInventarioResponse;
import com.servillantas.inventario.security.JwtUsuarioResolver;

public interface InventarioKardexService {

    List<InventarioStockResponse> obtenerStock();

    InventarioStockResponse obtenerStockPorProducto(UUID productoId);

    RegistroInventarioResponse registrarEntrada(RegistrarEntradaRequest request, JwtUsuarioResolver.Usuario usuario);

    RegistroInventarioResponse registrarSalida(RegistrarSalidaRequest request, JwtUsuarioResolver.Usuario usuario);

    List<MovimientoKardexResponse> listarMovimientos(UUID productoId, String tipo, LocalDate fechaDesde, LocalDate fechaHasta, String authorization);
}
