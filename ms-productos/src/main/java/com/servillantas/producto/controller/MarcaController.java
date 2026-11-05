package com.servillantas.producto.controller;

import com.servillantas.producto.dto.marca.MarcaRequest;
import com.servillantas.producto.dto.marca.MarcaResponse;
import com.servillantas.producto.service.MarcaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marcas")
@RequiredArgsConstructor
public class MarcaController {

    private final MarcaService marcaService;

    @PostMapping
    public ResponseEntity<MarcaResponse> crear(
            @Valid @RequestBody MarcaRequest request
    ) {
        MarcaResponse response = marcaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<MarcaResponse>> obtenerTodos() {
        return ResponseEntity.ok(marcaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarcaResponse> obtenerPorId(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(marcaService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarcaResponse> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody MarcaRequest request
    ) {
        return ResponseEntity.ok(
                marcaService.actualizar(id, request)
        );
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<MarcaResponse> toggleActivo(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(marcaService.toggleActivo(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id
    ) {
        marcaService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}