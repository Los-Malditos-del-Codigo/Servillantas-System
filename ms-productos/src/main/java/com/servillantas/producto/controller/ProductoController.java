package com.servillantas.producto.controller;

import com.servillantas.producto.dto.producto.ProductoRequest;
import com.servillantas.producto.dto.producto.ProductoResponse;
import com.servillantas.producto.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @PostMapping
    public ResponseEntity<ProductoResponse> crear(
            @Valid @RequestBody ProductoRequest request
    ) {
        ProductoResponse response = productoService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> obtenerTodos(
            @RequestParam(required = false) String search,
            @RequestParam(name = "categoria_id", required = false) UUID categoriaId,
            @RequestParam(name = "marca_id", required = false) UUID marcaId,
            @RequestParam(
                    name = "include_inactivos",
                    required = false,
                    defaultValue = "false"
            ) boolean includeInactivos
    ) {
        return ResponseEntity.ok(
                productoService.obtenerTodos(
                        search,
                        categoriaId,
                        marcaId,
                        includeInactivos
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> obtenerPorId(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ProductoRequest request
    ) {
        return ResponseEntity.ok(
                productoService.actualizar(id, request)
        );
    }

    @PatchMapping("/{id}/activo")
    public ResponseEntity<ProductoResponse> toggleActivo(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(productoService.toggleActivo(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id
    ) {
        productoService.eliminar(id);

        return ResponseEntity.noContent().build();
    }
}