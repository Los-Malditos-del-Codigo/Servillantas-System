package com.servillantas.compras.controller;

import com.servillantas.compras.dto.CrearProveedorRequestDto;
import com.servillantas.compras.dto.PageResponseDto;
import com.servillantas.compras.dto.ProveedorDto;
import com.servillantas.compras.service.ProveedoresService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/proveedores")
@Tag(name = "Proveedores", description = "Endpoints para la gestión de proveedores (HU-14, HU-15)")
public class ProveedoresController {

    private final ProveedoresService proveedoresService;

    public ProveedoresController(ProveedoresService proveedoresService) {
        this.proveedoresService = proveedoresService;
    }

    /**
     * HU-14: Registrar proveedores
     */
    @PostMapping
    @Operation(summary = "Registrar un nuevo proveedor", description = "Permite registrar un proveedor con nombre, RUC, teléfono, email y dirección")
    public ResponseEntity<ProveedorDto> crearProveedor(@Valid @RequestBody CrearProveedorRequestDto dto) {
        ProveedorDto creado = proveedoresService.crearProveedor(dto);
        URI location = URI.create("/api/v1/proveedores/" + creado.id());
        return ResponseEntity.created(location).body(creado);
    }

    /**
     * HU-15: Listar y buscar proveedores
     */
    @GetMapping
    @Operation(summary = "Listar y buscar proveedores", description = "Consulta paginada con filtros por texto de búsqueda (nombre/RUC) y estado activo")
    public ResponseEntity<PageResponseDto<ProveedorDto>> listarProveedores(
            @RequestParam(name = "busqueda", required = false) String busqueda,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "activo", required = false) Boolean activo,
            @PageableDefault(size = 10, sort = "nombre") Pageable pageable
    ) {
        String termino = (busqueda != null && !busqueda.isBlank()) ? busqueda : q;
        PageResponseDto<ProveedorDto> resultado = proveedoresService.listarProveedores(termino, activo, pageable);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener proveedor por ID", description = "Consulta los detalles de un proveedor específico")
    public ResponseEntity<ProveedorDto> obtenerPorId(@PathVariable UUID id) {
        ProveedorDto proveedor = proveedoresService.obtenerPorId(id);
        return ResponseEntity.ok(proveedor);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar proveedor", description = "Edita los datos de un proveedor existente")
    public ResponseEntity<ProveedorDto> actualizarProveedor(
            @PathVariable UUID id,
            @Valid @RequestBody CrearProveedorRequestDto dto
    ) {
        ProveedorDto actualizado = proveedoresService.actualizarProveedor(id, dto);
        return ResponseEntity.ok(actualizado);
    }

    @PatchMapping("/{id}/activo")
    @Operation(summary = "Activar/Desactivar proveedor", description = "Alterna el estado activo de un proveedor")
    public ResponseEntity<ProveedorDto> cambiarEstado(@PathVariable UUID id) {
        ProveedorDto proveedor = proveedoresService.obtenerPorId(id);
        ProveedorDto actualizado = proveedoresService.cambiarEstado(id, !Boolean.TRUE.equals(proveedor.activo()));
        return ResponseEntity.ok(actualizado);
    }
}
