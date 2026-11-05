package com.servillantas.inventario.controller;

import com.servillantas.inventario.dto.kardex.InventarioStockResponse;
import com.servillantas.inventario.dto.kardex.MovimientoKardexResponse;
import com.servillantas.inventario.dto.kardex.RegistrarEntradaRequest;
import com.servillantas.inventario.dto.kardex.RegistrarSalidaRequest;
import com.servillantas.inventario.dto.kardex.RegistroInventarioResponse;
import com.servillantas.inventario.security.JwtUsuarioResolver;
import com.servillantas.inventario.service.InventarioKardexService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
public class InventarioKardexController {

    private final InventarioKardexService inventarioKardexService;
    private final JwtUsuarioResolver usuarioResolver;

    @GetMapping("/stock")
    public ResponseEntity<List<InventarioStockResponse>> obtenerStock() {
        return ResponseEntity.ok(inventarioKardexService.obtenerStock());
    }

    @GetMapping("/stock/{productoId}")
    public ResponseEntity<InventarioStockResponse> obtenerStockPorProducto(@PathVariable UUID productoId) {
        return ResponseEntity.ok(inventarioKardexService.obtenerStockPorProducto(productoId));
    }

    @PostMapping("/entradas")
    public ResponseEntity<RegistroInventarioResponse> registrarEntrada(
            @Valid @RequestBody RegistrarEntradaRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventarioKardexService.registrarEntrada(request, usuarioResolver.resolver(authorization)));
    }

    @PostMapping("/salidas")
    public ResponseEntity<RegistroInventarioResponse> registrarSalida(
            @Valid @RequestBody RegistrarSalidaRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventarioKardexService.registrarSalida(request, usuarioResolver.resolver(authorization)));
    }

    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoKardexResponse>> listarMovimientos(
            @RequestParam(name = "producto_id", required = false) UUID productoId,
            @RequestParam(name = "tipo", required = false) String tipo,
            @RequestParam(name = "fecha_desde", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(name = "fecha_hasta", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(
                inventarioKardexService.listarMovimientos(productoId, tipo, fechaDesde, fechaHasta, authorization));
    }
}
