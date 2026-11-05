package com.servillantas.servicios.controller;

import com.servillantas.servicios.config.UsuarioActualProvider;
import com.servillantas.servicios.dto.*;
import com.servillantas.servicios.service.ServiciosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/servicios")
@Tag(name = "Servicios", description = "Operaciones de registro de servicios de taller y materiales")
public class ServiciosController {

    private final ServiciosService serviciosService;
    private final UsuarioActualProvider usuarioActualProvider;

    public ServiciosController(ServiciosService serviciosService, UsuarioActualProvider usuarioActualProvider) {
        this.serviciosService = serviciosService;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    @PostMapping
    @Operation(summary = "HU-20: Registrar servicio con tipo y precio", description = "Crea un servicio en estado REALIZADO validando que el tipo de servicio exista y esté activo.")
    @ApiResponse(responseCode = "201", description = "Servicio creado con éxito")
    @ApiResponse(responseCode = "200", description = "Petición idempotente repetida")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    @ApiResponse(responseCode = "404", description = "Tipo de servicio no encontrado")
    public ResponseEntity<ServicioDetalleDto> registrarServicio(
            @Parameter(description = "Clave de idempotencia única (UUID)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,

            @Parameter(description = "Identificador de correlación (UUID)", required = false)
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdHeader,

            @Valid @RequestBody CrearServicioRequestDto request
    ) {
        UUID correlationId = parseCorrelationId(correlationIdHeader);
        UUID usuarioId = usuarioActualProvider.getUsuarioId();

        ServiciosService.RegistroServicioResult result = serviciosService.registrarServicio(
                request, idempotencyKey.trim(), correlationId, usuarioId
        );

        if (result.replayed()) {
            return ResponseEntity.ok()
                    .header("Idempotent-Replayed", "true")
                    .body(result.servicio());
        }

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(result.servicio().id())
                .toUri();

        return ResponseEntity.created(location)
                .body(result.servicio());
    }

    @PostMapping("/{id}/materiales")
    @Operation(summary = "HU-21: Registrar material usado y descontarlo de inventario", description = "Agrega un material a un servicio existente y emite la salida en MS-Inventario.")
    @ApiResponse(responseCode = "201", description = "Material registrado y descontado con éxito")
    @ApiResponse(responseCode = "200", description = "Petición idempotente repetida")
    @ApiResponse(responseCode = "400", description = "Servicio anulado o material inválido")
    @ApiResponse(responseCode = "409", description = "Stock insuficiente o producto duplicado en servicio")
    @ApiResponse(responseCode = "503", description = "MS-Inventario no disponible")
    public ResponseEntity<MaterialServicioDto> agregarMaterial(
            @PathVariable UUID id,

            @Parameter(description = "Clave de idempotencia única (UUID)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,

            @Parameter(description = "Identificador de correlación (UUID)", required = false)
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdHeader,

            @Valid @RequestBody CrearMaterialRequestDto request
    ) {
        UUID correlationId = parseCorrelationId(correlationIdHeader);

        ServiciosService.RegistroMaterialResult result = serviciosService.agregarMaterial(
                id, request, idempotencyKey.trim(), correlationId
        );

        if (result.replayed()) {
            return ResponseEntity.ok()
                    .header("Idempotent-Replayed", "true")
                    .body(result.material());
        }

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{materialId}")
                .buildAndExpand(result.material().id())
                .toUri();

        return ResponseEntity.created(location)
                .body(result.material());
    }

    @PostMapping("/{id}/anulacion")
    @Operation(summary = "HU-49: Anular servicio", description = "Anula un servicio REALIZADO, reintegra los materiales consumidos al inventario y registra el motivo.")
    @ApiResponse(responseCode = "200", description = "Servicio anulado")
    @ApiResponse(responseCode = "400", description = "Motivo o idempotencia inválidos")
    @ApiResponse(responseCode = "404", description = "Servicio no encontrado")
    @ApiResponse(responseCode = "409", description = "Estado inválido para anulación")
    public ResponseEntity<ServicioDetalleDto> anularServicio(
            @PathVariable UUID id,

            @Parameter(description = "Clave de idempotencia única (UUID)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,

            @Parameter(description = "Identificador de correlación (UUID)", required = false)
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationIdHeader,

            @Valid @RequestBody AnularServicioRequestDto request
    ) {
        UUID correlationId = parseCorrelationId(correlationIdHeader);
        ServicioDetalleDto anulado = serviciosService.anularServicio(id, idempotencyKey.trim(), request.motivo(), correlationId);
        return ResponseEntity.ok(anulado);
    }

    @GetMapping
    @Operation(summary = "HU-22: Consultar historial de servicios", description = "Lista servicios paginados con filtros opcionales de tipo, estado y fechas.")
    public ResponseEntity<PageResponseDto<ServicioResumenDto>> listarServicios(
            @RequestParam(required = false) UUID tipoServicioId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fecha") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        PageResponseDto<ServicioResumenDto> resultado = serviciosService.listarServicios(
                tipoServicioId, estado, desde, hasta, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "HU-22: Consultar detalle de servicio", description = "Obtiene la información cabecera del servicio y su lista de materiales consumidos.")
    public ResponseEntity<ServicioDetalleDto> obtenerServicioPorId(@PathVariable UUID id) {
        ServicioDetalleDto detalle = serviciosService.obtenerServicioPorId(id);
        return ResponseEntity.ok(detalle);
    }

    private UUID parseCorrelationId(String header) {
        if (header != null && !header.isBlank()) {
            try {
                return UUID.fromString(header.trim());
            } catch (IllegalArgumentException ignored) {}
        }
        return UUID.randomUUID();
    }
}
