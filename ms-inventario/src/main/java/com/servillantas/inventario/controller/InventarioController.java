package com.servillantas.inventario.controller;

import com.servillantas.inventario.dto.inventario.InventarioRequest;
import com.servillantas.inventario.dto.inventario.InventarioResponse;
import com.servillantas.inventario.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventarios")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @PostMapping
    public ResponseEntity<InventarioResponse> crear(@Valid @RequestBody InventarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventarioService.crear(request));
    }

    @GetMapping
    public ResponseEntity<List<InventarioResponse>> obtenerTodos() {
        return ResponseEntity.ok(inventarioService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventarioResponse> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<InventarioResponse> obtenerPorProductoId(@PathVariable UUID productoId) {
        return ResponseEntity.ok(inventarioService.obtenerPorProductoId(productoId));
    }

}
