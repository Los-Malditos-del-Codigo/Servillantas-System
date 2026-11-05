package com.servillantas.producto.controller;

import com.servillantas.producto.dto.unidadmedida.UnidadMedidaRequest;
import com.servillantas.producto.dto.unidadmedida.UnidadMedidaResponse;
import com.servillantas.producto.service.UnidadMedidaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/unidades-medida")
@RequiredArgsConstructor
public class UnidadMedidaController {

    private final UnidadMedidaService unidadMedidaService;

    @PostMapping
    public ResponseEntity<UnidadMedidaResponse> crear(
            @Valid @RequestBody UnidadMedidaRequest request
    ) {
        UnidadMedidaResponse response = unidadMedidaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<UnidadMedidaResponse>> obtenerTodos() {
        return ResponseEntity.ok(unidadMedidaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnidadMedidaResponse> obtenerPorId(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                unidadMedidaService.obtenerPorId(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnidadMedidaResponse> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody UnidadMedidaRequest request
    ) {
        return ResponseEntity.ok(
                unidadMedidaService.actualizar(id, request)
        );
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<UnidadMedidaResponse> toggleActivo(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(unidadMedidaService.toggleActivo(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id
    ) {
        unidadMedidaService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}