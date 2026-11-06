package com.servillantas.compras.controller;

import com.servillantas.compras.dto.AnularCompraRequestDto;
import com.servillantas.compras.dto.CompraDetalleDto;
import com.servillantas.compras.dto.CompraResumenDto;
import com.servillantas.compras.dto.CrearCompraRequestDto;
import com.servillantas.compras.dto.PageResponseDto;
import com.servillantas.compras.service.ComprasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/compras")
@Tag(name = "Compras", description = "Endpoints para registro, historial y recepción de compras (HU-16, HU-17, HU-46)")
public class ComprasController {

    private static final ZoneId ZONE_LIMA = ZoneId.of("America/Lima");
    private final ComprasService comprasService;

    public ComprasController(ComprasService comprasService) {
        this.comprasService = comprasService;
    }

    /**
     * HU-16: Registrar compras o reposiciones
     * Header Idempotency-Key obligatorio.
     */
    @PostMapping
    @Operation(summary = "Registrar una nueva compra o reposición", description = "Crea una compra en estado REGISTRADA sin modificar el inventario. Requiere cabecera Idempotency-Key.")
    public ResponseEntity<CompraDetalleDto> crearCompra(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdStr,
            @Valid @RequestBody CrearCompraRequestDto dto
    ) {
        UUID correlationId = parseUuidOrNull(correlationIdStr);
        CompraDetalleDto creada = comprasService.crearCompra(dto, idempotencyKey, correlationId);
        URI location = URI.create("/api/v1/compras/" + creada.id());
        return ResponseEntity.created(location).body(creada);
    }

    /**
     * HU-17: Consultar historial de compras (listado paginado)
     */
    @GetMapping
    @Operation(summary = "Consultar historial de compras", description = "Listado paginado con filtros por proveedor, estado y rango de fechas.")
    public ResponseEntity<PageResponseDto<CompraResumenDto>> listarCompras(
            @RequestParam(name = "proveedor_id", required = false) UUID proveedorId,
            @RequestParam(name = "proveedorId", required = false) UUID proveedorIdAlt,
            @RequestParam(name = "estado", required = false) String estado,
            @RequestParam(name = "fecha_inicio", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fechaInicio,
            @RequestParam(name = "fecha_fin", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fechaFin,
            @RequestParam(name = "desde", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(name = "hasta", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @PageableDefault(size = 10, sort = "fecha") Pageable pageable
    ) {
        UUID provId = proveedorId != null ? proveedorId : proveedorIdAlt;
        OffsetDateTime inicio = fechaInicio != null ? fechaInicio
                : (desde != null ? desde.atStartOfDay(ZONE_LIMA).toOffsetDateTime() : null);
        OffsetDateTime fin = fechaFin != null ? fechaFin
                : (hasta != null ? hasta.plusDays(1).atStartOfDay(ZONE_LIMA).toOffsetDateTime().minusNanos(1) : null);
        PageResponseDto<CompraResumenDto> resultado = comprasService.listarCompras(
                provId, estado, inicio, fin, pageable
        );
        return ResponseEntity.ok(resultado);
    }

    /**
     * HU-17: Consultar detalle de una compra
     */
    @GetMapping("/{id}")
    @Operation(summary = "Consultar detalle de una compra por ID", description = "Devuelve cabecera completa y líneas de detalle de la compra.")
    public ResponseEntity<CompraDetalleDto> obtenerPorId(@PathVariable UUID id) {
        CompraDetalleDto detalle = comprasService.obtenerCompraPorId(id);
        return ResponseEntity.ok(detalle);
    }

    /**
     * HU-46: Confirmar recepción de una compra
     * Header Idempotency-Key obligatorio.
     * Invoca a MS-Inventario para dar entrada al stock.
     */
    @PostMapping("/{id}/recepcion")
    @Operation(summary = "Confirmar recepción de compra", description = "Registra las entradas de stock en MS-Inventario y actualiza el estado a RECIBIDA.")
    public ResponseEntity<CompraDetalleDto> confirmarRecepcion(
            @PathVariable UUID id,
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdStr
    ) {
        UUID correlationId = parseUuidOrNull(correlationIdStr);
        CompraDetalleDto confirmada = comprasService.confirmarRecepcion(id, idempotencyKey, correlationId);
        return ResponseEntity.ok(confirmada);
    }

    /**
     * HU-47: Anular una compra REGISTRADA (no recibida).
     */
    @PostMapping("/{id}/anulacion")
    @Operation(summary = "Anular compra", description = "Anula una compra en estado REGISTRADA. Requiere el motivo de anulación.")
    public ResponseEntity<CompraDetalleDto> anularCompra(
            @PathVariable UUID id,
            @Valid @RequestBody AnularCompraRequestDto request
    ) {
        CompraDetalleDto anulada = comprasService.anularCompra(id, request.motivo());
        return ResponseEntity.ok(anulada);
    }

    private UUID parseUuidOrNull(String str) {
        if (str == null || str.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(str.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
