package com.servillantas.inventario.controller;

import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioRequest;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioResponse;
import com.servillantas.inventario.service.MovimientoInventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/movimientos-inventario")
@RequiredArgsConstructor
public class MovimientoInventarioController {

    private final MovimientoInventarioService movimientoService;

    @PostMapping
    public ResponseEntity<MovimientoInventarioResponse> registrar(
            @Valid @RequestBody MovimientoInventarioRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(movimientoService.registrar(request));
    }

    @GetMapping
    public ResponseEntity<List<MovimientoInventarioResponse>> obtenerTodos() {
        return ResponseEntity.ok(movimientoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovimientoInventarioResponse> obtenerPorId(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(movimientoService.obtenerPorId(id));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventarioResponse>> obtenerPorProducto(
            @PathVariable UUID productoId
    ) {
        return ResponseEntity.ok(movimientoService.obtenerPorProducto(productoId));
    }

    @GetMapping("/producto/{productoId}/tipo/{tipo}")
    public ResponseEntity<List<MovimientoInventarioResponse>> obtenerPorProductoYTipo(
            @PathVariable UUID productoId,
            @PathVariable String tipo
    ) {
        return ResponseEntity.ok(
                movimientoService.obtenerPorProductoYTipo(productoId, tipo)
        );
    }
}
