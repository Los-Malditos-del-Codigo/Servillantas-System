package com.servillantas.alertas.controller;

import com.servillantas.alertas.config.UsuarioActualProvider;
import com.servillantas.alertas.dto.NotificacionDto;
import com.servillantas.alertas.dto.PageResponseDto;
import com.servillantas.alertas.service.NotificacionesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notificaciones")
@Tag(name = "Notificaciones", description = "Operaciones de consulta y lectura de notificaciones de usuario")
public class NotificacionesController {

    private final NotificacionesService notificacionesService;
    private final UsuarioActualProvider usuarioActualProvider;

    public NotificacionesController(NotificacionesService notificacionesService, UsuarioActualProvider usuarioActualProvider) {
        this.notificacionesService = notificacionesService;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    @GetMapping
    @Operation(summary = "Listar notificaciones del usuario", description = "Consulta notificaciones paginadas del usuario autenticado con filtro opcional por leída.")
    public ResponseEntity<PageResponseDto<NotificacionDto>> listar(
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(required = false) Boolean leida,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        PageResponseDto<NotificacionDto> resultado = notificacionesService.listarNotificaciones(usuarioId, leida, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

    @PatchMapping("/{id}/leer")
    @Operation(summary = "Marcar notificación como leída", description = "Actualiza el estado de la notificación a leída registrando la fecha de lectura.")
    @ApiResponse(responseCode = "200", description = "Notificación marcada como leída")
    @ApiResponse(responseCode = "403", description = "La notificación pertenece a otro usuario")
    @ApiResponse(responseCode = "404", description = "Notificación no encontrada")
    public ResponseEntity<NotificacionDto> leer(
            @PathVariable UUID id,
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        NotificacionDto leida = notificacionesService.marcarComoLeida(id, usuarioId);
        return ResponseEntity.ok(leida);
    }

    private UUID resolverUsuarioId(String header) {
        if (header != null && !header.isBlank()) {
            try {
                return UUID.fromString(header.trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return usuarioActualProvider.getUsuarioId();
    }
}
