package com.servillantas.servicios.controller;

import com.servillantas.servicios.dto.ActualizarTipoServicioRequestDto;
import com.servillantas.servicios.dto.CrearTipoServicioRequestDto;
import com.servillantas.servicios.dto.TipoServicioDto;
import com.servillantas.servicios.service.ServiciosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tipos-servicio")
@Tag(name = "Tipos de Servicio", description = "Catálogo de tipos de servicio para talleres")
public class TiposServicioController {

    private final ServiciosService serviciosService;

    public TiposServicioController(ServiciosService serviciosService) {
        this.serviciosService = serviciosService;
    }

    @GetMapping
    @Operation(summary = "HU-20: Listar tipos de servicio", description = "Lista tipos de servicio. Con 'activo=true' solo los activos; sin el parámetro, todos.")
    public ResponseEntity<List<TipoServicioDto>> listarTiposServicio(
            @RequestParam(name = "activo", required = false) Boolean activo
    ) {
        return ResponseEntity.ok(serviciosService.listarTiposServicio(activo));
    }

    @PostMapping
    @Operation(summary = "HU-23: Crear tipo de servicio", description = "Crea un nuevo tipo de servicio del catálogo.")
    @ApiResponse(responseCode = "201", description = "Tipo de servicio creado")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o nombre duplicado")
    public ResponseEntity<TipoServicioDto> crearTipoServicio(@Valid @RequestBody CrearTipoServicioRequestDto request) {
        TipoServicioDto creado = serviciosService.crearTipoServicio(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creado.id())
                .toUri();
        return ResponseEntity.created(location).body(creado);
    }

    @PutMapping("/{id}")
    @Operation(summary = "HU-23: Actualizar tipo de servicio", description = "Edita un tipo de servicio existente.")
    @ApiResponse(responseCode = "200", description = "Tipo de servicio actualizado")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o nombre duplicado")
    @ApiResponse(responseCode = "404", description = "Tipo de servicio no encontrado")
    public ResponseEntity<TipoServicioDto> actualizarTipoServicio(
            @PathVariable UUID id,
            @Valid @RequestBody ActualizarTipoServicioRequestDto request
    ) {
        return ResponseEntity.ok(serviciosService.actualizarTipoServicio(id, request));
    }

    @PatchMapping("/{id}/activo")
    @Operation(summary = "HU-23: Activar/Desactivar tipo de servicio", description = "Alterna el estado activo de un tipo de servicio.")
    public ResponseEntity<TipoServicioDto> cambiarEstadoTipoServicio(@PathVariable UUID id) {
        return ResponseEntity.ok(serviciosService.cambiarEstadoTipoServicio(id, null));
    }
}
