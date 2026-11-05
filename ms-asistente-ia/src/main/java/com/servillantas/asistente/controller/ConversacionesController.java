package com.servillantas.asistente.controller;

import com.servillantas.asistente.config.UsuarioActualProvider;
import com.servillantas.asistente.dto.*;
import com.servillantas.asistente.service.ConversacionesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversaciones-ia")
@Tag(name = "Asistente IA", description = "Operaciones de conversaciones y mensajes con el asistente inteligente")
public class ConversacionesController {

    private final ConversacionesService conversacionesService;
    private final UsuarioActualProvider usuarioActualProvider;

    public ConversacionesController(ConversacionesService conversacionesService, UsuarioActualProvider usuarioActualProvider) {
        this.conversacionesService = conversacionesService;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    @PostMapping
    @Operation(summary = "Crear nueva conversación", description = "Inicializa una conversación para el usuario autenticado.")
    @ApiResponse(responseCode = "201", description = "Conversación creada")
    public ResponseEntity<ConversacionDto> crear(
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody CrearConversacionRequestDto request
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        ConversacionDto conversacion = conversacionesService.crearConversacion(usuarioId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(conversacion.id())
                .toUri();

        return ResponseEntity.created(location).body(conversacion);
    }

    @GetMapping
    @Operation(summary = "Listar conversaciones", description = "Obtiene las conversaciones paginadas del usuario autenticado.")
    public ResponseEntity<PageResponseDto<ConversacionDto>> listar(
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        PageResponseDto<ConversacionDto> resultado = conversacionesService.listarConversaciones(usuarioId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de conversación con mensajes", description = "Recupera la cabecera y el historial de mensajes de la conversación.")
    @ApiResponse(responseCode = "200", description = "Detalle obtenido")
    @ApiResponse(responseCode = "403", description = "La conversación pertenece a otro usuario")
    @ApiResponse(responseCode = "404", description = "Conversación no encontrada")
    public ResponseEntity<ConversacionDetalleDto> detalle(
            @PathVariable UUID id,
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        ConversacionDetalleDto detalle = conversacionesService.obtenerDetalle(id, usuarioId);
        return ResponseEntity.ok(detalle);
    }

    @PostMapping("/{id}/mensajes")
    @Operation(summary = "Agregar mensaje a la conversación", description = "Envía un nuevo mensaje con rol USER a una conversación existente.")
    @ApiResponse(responseCode = "201", description = "Mensaje agregado")
    @ApiResponse(responseCode = "400", description = "Rol inválido o mensaje vacío")
    public ResponseEntity<MensajeDto> agregarMensaje(
            @PathVariable UUID id,
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody CrearMensajeRequestDto request
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        MensajeDto mensaje = conversacionesService.agregarMensaje(id, usuarioId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{mensajeId}")
                .buildAndExpand(mensaje.id())
                .toUri();

        return ResponseEntity.created(location).body(mensaje);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar conversación", description = "Elimina una conversación y todos sus mensajes asociados.")
    @ApiResponse(responseCode = "204", description = "Conversación eliminada")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID id,
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        conversacionesService.eliminarConversacion(id, usuarioId);
        return ResponseEntity.noContent().build();
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
