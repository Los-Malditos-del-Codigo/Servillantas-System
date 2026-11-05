package com.servillantas.producto.controller;

import com.servillantas.producto.dto.categoria.CategoriaRequest;
import com.servillantas.producto.dto.categoria.CategoriaResponse;
import com.servillantas.producto.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(
            @Valid @RequestBody CategoriaRequest request
    ) {
        CategoriaResponse response = categoriaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> obtenerTodos() {
        return ResponseEntity.ok(categoriaService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponse> obtenerPorId(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(categoriaService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody CategoriaRequest request
    ) {
        return ResponseEntity.ok(
                categoriaService.actualizar(id, request)
        );
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<CategoriaResponse> toggleActivo(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(categoriaService.toggleActivo(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id
    ) {
        categoriaService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}