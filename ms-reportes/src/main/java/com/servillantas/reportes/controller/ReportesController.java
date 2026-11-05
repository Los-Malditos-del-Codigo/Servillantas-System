package com.servillantas.reportes.controller;

import com.servillantas.reportes.config.UsuarioActualProvider;
import com.servillantas.reportes.dto.CrearReporteRequestDto;
import com.servillantas.reportes.dto.PageResponseDto;
import com.servillantas.reportes.dto.ReporteDto;
import com.servillantas.reportes.service.ReportesService;
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
@RequestMapping("/api/v1/reportes")
@Tag(name = "Reportes", description = "Operaciones de generación y consulta de reportes")
public class ReportesController {

    private final ReportesService reportesService;
    private final UsuarioActualProvider usuarioActualProvider;

    public ReportesController(ReportesService reportesService, UsuarioActualProvider usuarioActualProvider) {
        this.reportesService = reportesService;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    @PostMapping
    @Operation(summary = "Crear solicitud de reporte", description = "Registra una solicitud de reporte en formato PDF o XLSX.")
    @ApiResponse(responseCode = "201", description = "Reporte creado exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    public ResponseEntity<ReporteDto> crear(
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @Valid @RequestBody CrearReporteRequestDto request
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        ReporteDto reporte = reportesService.crearReporte(usuarioId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(reporte.id())
                .toUri();

        return ResponseEntity.created(location).body(reporte);
    }

    @GetMapping
    @Operation(summary = "Listar reportes del usuario", description = "Devuelve los reportes paginados generados por el usuario autenticado.")
    public ResponseEntity<PageResponseDto<ReporteDto>> listar(
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(required = false) String tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        PageResponseDto<ReporteDto> resultado = reportesService.listarReportes(usuarioId, tipo, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de reporte", description = "Recupera la información de un reporte específico verificando pertenencia.")
    @ApiResponse(responseCode = "200", description = "Reporte encontrado")
    @ApiResponse(responseCode = "403", description = "El reporte no pertenece al usuario")
    @ApiResponse(responseCode = "404", description = "Reporte no encontrado")
    public ResponseEntity<ReporteDto> detalle(
            @PathVariable UUID id,
            @Parameter(description = "Identificador del usuario autenticado (UUID)")
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader);
        ReporteDto reporte = reportesService.obtenerReportePorId(id, usuarioId);
        return ResponseEntity.ok(reporte);
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
