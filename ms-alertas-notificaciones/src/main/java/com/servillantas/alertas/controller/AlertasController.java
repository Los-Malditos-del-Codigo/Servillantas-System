package com.servillantas.alertas.controller;

import com.servillantas.alertas.dto.*;
import com.servillantas.alertas.service.AlertasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alertas")
@Tag(name = "Alertas", description = "Operaciones de gestión y resolución de alertas del sistema")
public class AlertasController {

    private final AlertasService alertasService;

    public AlertasController(AlertasService alertasService) {
        this.alertasService = alertasService;
    }

    @PostMapping
    @Operation(summary = "Crear alerta", description = "Crea o recupera una alerta activa para un producto.")
    @ApiResponse(responseCode = "201", description = "Alerta creada")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    public ResponseEntity<AlertaDto> crear(@Valid @RequestBody CrearAlertaRequestDto request) {
        AlertaDto alerta = alertasService.crearAlerta(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(alerta.id())
                .toUri();

        return ResponseEntity.created(location).body(alerta);
    }

    @GetMapping
    @Operation(summary = "Listar alertas", description = "Consulta alertas paginadas con filtro opcional por estado (ACTIVA, RESUELTA).")
    public ResponseEntity<PageResponseDto<AlertaDto>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        PageResponseDto<AlertaDto> resultado = alertasService.listarAlertas(estado, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

    @PatchMapping("/{id}/resolver")
    @Operation(summary = "Resolver alerta", description = "Marca una alerta activa como RESUELTA.")
    @ApiResponse(responseCode = "200", description = "Alerta resuelta con éxito")
    @ApiResponse(responseCode = "404", description = "Alerta no encontrada")
    public ResponseEntity<AlertaDto> resolver(@PathVariable UUID id) {
        AlertaDto resuelta = alertasService.resolverAlerta(id);
        return ResponseEntity.ok(resuelta);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Actualizar estado de alerta", description = "Actualiza el estado de una alerta (pendiente/ACTIVA, leida/LEIDA, resuelta/RESUELTA).")
    @ApiResponse(responseCode = "200", description = "Estado actualizado con éxito")
    @ApiResponse(responseCode = "404", description = "Alerta no encontrada")
    public ResponseEntity<AlertaDto> actualizarEstado(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String estado = body != null ? body.get("estado") : null;
        AlertaDto actualizada = alertasService.actualizarEstado(id, estado);
        return ResponseEntity.ok(actualizada);
    }

    @PostMapping("/{id}/notificaciones")
    @Operation(summary = "Notificar usuario para una alerta", description = "Crea una notificación vinculada a la alerta para un usuario específico.")
    @ApiResponse(responseCode = "201", description = "Notificación generada")
    @ApiResponse(responseCode = "404", description = "Alerta o usuario no encontrados")
    @ApiResponse(responseCode = "409", description = "El usuario ya fue notificado previamente")
    public ResponseEntity<NotificacionDto> notificar(
            @PathVariable UUID id,
            @Valid @RequestBody NotificarAlertaRequestDto request
    ) {
        NotificacionDto notificacion = alertasService.notificar(id, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{notificacionId}")
                .buildAndExpand(notificacion.id())
                .toUri();

        return ResponseEntity.created(location).body(notificacion);
    }
}
