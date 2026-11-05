package com.servillantas.ventas.controller;

import com.servillantas.ventas.config.UsuarioActualProvider;
import com.servillantas.ventas.dto.AnularVentaRequestDto;
import com.servillantas.ventas.dto.CrearVentaRequestDto;
import com.servillantas.ventas.dto.PageResponseDto;
import com.servillantas.ventas.dto.VentaDetalleDto;
import com.servillantas.ventas.dto.VentaResumenDto;
import com.servillantas.ventas.service.VentasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ventas")
@Tag(name = "Ventas", description = "Operaciones de registro y consulta de ventas")
public class VentasController {

    private final VentasService ventasService;
    private final UsuarioActualProvider usuarioActualProvider;

    public VentasController(VentasService ventasService, UsuarioActualProvider usuarioActualProvider) {
        this.ventasService = ventasService;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    @PostMapping
    @Operation(summary = "HU-18: Registrar nueva venta", description = "Registra una venta, descuenta stock de manera idempotente y confirma la transacción.")
    @ApiResponse(responseCode = "201", description = "Venta registrada con éxito")
    @ApiResponse(responseCode = "200", description = "Petición idempotente repetida")
    @ApiResponse(responseCode = "400", description = "Validación fallida")
    @ApiResponse(responseCode = "409", description = "Stock insuficiente o conflicto de idempotencia")
    @ApiResponse(responseCode = "503", description = "MS-Inventario no disponible")
    public ResponseEntity<VentaDetalleDto> registrarVenta(
            @Parameter(description = "Clave de idempotencia única (UUID)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,

            @Parameter(description = "Identificador de correlación (UUID)", required = false)
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdHeader,

            @Valid @RequestBody CrearVentaRequestDto request
    ) {
        UUID correlationId = null;
        if (correlationIdHeader != null && !correlationIdHeader.isBlank()) {
            try {
                correlationId = UUID.fromString(correlationIdHeader.trim());
            } catch (IllegalArgumentException ignored) {}
        }
        if (correlationId == null) {
            correlationId = UUID.randomUUID();
        }

        UUID usuarioId = usuarioActualProvider.getUsuarioId();

        VentasService.RegistroVentaResult result = ventasService.registrarVenta(request, idempotencyKey.trim(), correlationId, usuarioId);

        if (result.replayed()) {
            return ResponseEntity.ok()
                    .header("Idempotent-Replayed", "true")
                    .body(result.venta());
        }

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(result.venta().id())
                .toUri();

        return ResponseEntity.created(location)
                .body(result.venta());
    }

    @PostMapping("/{id}/anulacion")
    @Operation(summary = "HU-48: Anular venta", description = "Anula una venta CONFIRMADA, reintegra el stock de sus líneas y registra el motivo.")
    @ApiResponse(responseCode = "200", description = "Venta anulada")
    @ApiResponse(responseCode = "400", description = "Motivo o idempotencia inválidos")
    @ApiResponse(responseCode = "404", description = "Venta no encontrada")
    @ApiResponse(responseCode = "409", description = "Estado inválido para anulación")
    public ResponseEntity<VentaDetalleDto> anularVenta(
            @PathVariable UUID id,

            @Parameter(description = "Clave de idempotencia única (UUID)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,

            @Parameter(description = "Identificador de correlación (UUID)", required = false)
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdHeader,

            @Valid @RequestBody AnularVentaRequestDto request
    ) {
        UUID correlationId = null;
        if (correlationIdHeader != null && !correlationIdHeader.isBlank()) {
            try {
                correlationId = UUID.fromString(correlationIdHeader.trim());
            } catch (IllegalArgumentException ignored) {}
        }

        VentaDetalleDto anulada = ventasService.anularVenta(id, idempotencyKey.trim(), request.motivo(), correlationId);
        return ResponseEntity.ok(anulada);
    }

    @GetMapping
    @Operation(summary = "HU-19: Listar ventas", description = "Lista ventas paginadas con filtros opcionales de estado y rango de fechas.")
    public ResponseEntity<PageResponseDto<VentaResumenDto>> listarVentas(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fecha") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        PageResponseDto<VentaResumenDto> resultado = ventasService.listarVentas(estado, desde, hasta, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "HU-19: Consultar detalle de venta", description = "Obtiene la cabecera y todas las líneas de detalle de una venta por ID.")
    public ResponseEntity<VentaDetalleDto> obtenerVentaPorId(@PathVariable UUID id) {
        VentaDetalleDto detalle = ventasService.obtenerVentaPorId(id);
        return ResponseEntity.ok(detalle);
    }
}
