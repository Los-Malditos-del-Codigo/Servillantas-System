package com.servillantas.inventario.controller;

import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioRequest;
import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioResponse;
import com.servillantas.inventario.service.AjusteInventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ajustes-inventario")
@RequiredArgsConstructor
public class AjusteInventarioController {

    private final AjusteInventarioService ajusteInventarioService;

    @PostMapping
    public ResponseEntity<AjusteInventarioResponse> crear(
            @Valid @RequestBody AjusteInventarioRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ajusteInventarioService.crear(request));
    }

    @GetMapping
    public ResponseEntity<List<AjusteInventarioResponse>> obtenerTodos() {
        return ResponseEntity.ok(ajusteInventarioService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AjusteInventarioResponse> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ajusteInventarioService.obtenerPorId(id));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<AjusteInventarioResponse>> obtenerPorProductoId(
            @PathVariable UUID productoId
    ) {
        return ResponseEntity.ok(ajusteInventarioService.obtenerPorProductoId(productoId));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AjusteInventarioResponse>> obtenerPorUsuarioId(
            @PathVariable UUID usuarioId
    ) {
        return ResponseEntity.ok(ajusteInventarioService.obtenerPorUsuarioId(usuarioId));
    }

}
