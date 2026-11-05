package com.servillantas.ventas.service;

import com.servillantas.ventas.client.InventarioClient;
import com.servillantas.ventas.client.MovimientoInventarioRequest;
import com.servillantas.ventas.domain.DetalleVenta;
import com.servillantas.ventas.domain.Venta;
import com.servillantas.ventas.domain.VentaEstado;
import com.servillantas.ventas.dto.*;
import com.servillantas.ventas.exception.IdempotencyConflictException;
import com.servillantas.ventas.exception.RecursoNoEncontradoException;
import com.servillantas.ventas.exception.StockInsuficienteException;
import com.servillantas.ventas.exception.ValidacionException;
import com.servillantas.ventas.repository.VentaRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class VentasService {

    private static final Logger log = LoggerFactory.getLogger(VentasService.class);
    private static final ZoneId ZONE_LIMA = ZoneId.of("America/Lima");
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("fecha", "total", "estado", "createdAt");

    private final VentaRepository ventaRepository;
    private final InventarioClient inventarioClient;

    public VentasService(VentaRepository ventaRepository, InventarioClient inventarioClient) {
        this.ventaRepository = ventaRepository;
        this.inventarioClient = inventarioClient;
    }

    public record RegistroVentaResult(VentaDetalleDto venta, boolean replayed) {}

    /**
     * HU-18: Registrar venta y actualizar stock con saga consistente y clave de idempotencia.
     */
    public RegistroVentaResult registrarVenta(
            CrearVentaRequestDto request,
            String idempotencyKey,
            UUID correlationId,
            UUID usuarioId
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ValidacionException("El encabezado Idempotency-Key es obligatorio.");
        }

        // 1. Chequeo de idempotencia
        Optional<Venta> ventaExistenteOpt = ventaRepository.findByIdempotencyKey(idempotencyKey);
        if (ventaExistenteOpt.isPresent()) {
            Venta existente = ventaExistenteOpt.get();
            if (verificarCoincidenciaPayload(existente, request)) {
                log.info("Petición idempotente repetida con Idempotency-Key {}. Retornando venta existente.", idempotencyKey);
                return new RegistroVentaResult(mapearAVentaDetalle(existente), true);
            } else {
                throw new IdempotencyConflictException("La Idempotency-Key ya fue usada previamente con otro contenido.");
            }
        }

        // 2. Validar y calcular
        validarRequest(request);

        BigDecimal total = BigDecimal.ZERO;
        List<UUID> detalleIds = new ArrayList<>();
        for (CrearVentaItemDto item : request.items()) {
            detalleIds.add(UUID.randomUUID());
            BigDecimal subtotal = item.cantidad().multiply(item.precioUnitario()).setScale(2, RoundingMode.HALF_UP);
            total = total.add(subtotal);
        }

        // 3. Generar UUID de la venta
        UUID ventaId = UUID.randomUUID();

        // 4. Registrar salidas en MS-Inventario con clave determinística
        List<MovimientoInventarioRequest> salidasRealizadas = new ArrayList<>();
        List<String> clavesSalidas = new ArrayList<>();

        try {
            for (int i = 0; i < request.items().size(); i++) {
                CrearVentaItemDto item = request.items().get(i);
                UUID detalleId = detalleIds.get(i);
                String claveLinea = idempotencyKey + "-LINEA-" + i;

                MovimientoInventarioRequest mov = new MovimientoInventarioRequest(
                        item.productoId(),
                        item.cantidad(),
                        "Venta",
                        "venta",
                        ventaId,
                        detalleId
                );

                inventarioClient.registrarSalida(mov, claveLinea, correlationId != null ? correlationId.toString() : null);
                salidasRealizadas.add(mov);
                clavesSalidas.add(claveLinea);
            }
        } catch (StockInsuficienteException ex) {
            log.warn("Stock insuficiente para venta {}. Compensando {} salidas previas...", ventaId, salidasRealizadas.size());
            // 5. Compensar salidas ya realizadas
            for (int i = 0; i < salidasRealizadas.size(); i++) {
                MovimientoInventarioRequest mov = salidasRealizadas.get(i);
                String claveCompensacion = clavesSalidas.get(i) + "-COMPENSATE";
                MovimientoInventarioRequest rev = new MovimientoInventarioRequest(
                        mov.productoId(),
                        mov.cantidad(),
                        "Reversión por operación fallida",
                        "venta",
                        ventaId,
                        mov.referenciaDetalleId()
                );
                try {
                    inventarioClient.compensarEntrada(rev, claveCompensacion, correlationId != null ? correlationId.toString() : null);
                } catch (Exception eRev) {
                    log.error("Fallo al compensar entrada para producto {}: {}", mov.productoId(), eRev.getMessage());
                }
            }
            throw ex;
        }

        // 6 & 7. Persistir venta + detalles con reintento ante fallos transitorios
        int intentos = 0;
        while (true) {
            try {
                intentos++;
                Venta ventaGuardada = guardarVentaTransaccional(ventaId, usuarioId, idempotencyKey, correlationId, request, detalleIds, total);
                return new RegistroVentaResult(mapearAVentaDetalle(ventaGuardada), false);
            } catch (DataIntegrityViolationException dive) {
                // Condición de carrera por concurrencia en la Idempotency-Key
                Optional<Venta> carreraOpt = ventaRepository.findByIdempotencyKey(idempotencyKey);
                if (carreraOpt.isPresent()) {
                    Venta carreraVenta = carreraOpt.get();
                    if (verificarCoincidenciaPayload(carreraVenta, request)) {
                        return new RegistroVentaResult(mapearAVentaDetalle(carreraVenta), true);
                    }
                    throw new IdempotencyConflictException("Conflicto con Idempotency-Key en concurrencia.");
                }
                throw dive;
            } catch (Exception ex) {
                if (intentos >= 3) {
                    log.error("ERROR [CorrelationId: {}] No se pudo persistir la venta {} tras reintentos: {}",
                            correlationId, ventaId, ex.getMessage(), ex);
                    throw new RuntimeException("Error persistiendo venta tras reintentos", ex);
                }
                log.warn("Reintentando persistencia de venta {} (intento {})...", ventaId, intentos);
            }
        }
    }

    @Transactional
    public Venta guardarVentaTransaccional(
            UUID ventaId,
            UUID usuarioId,
            String idempotencyKey,
            UUID correlationId,
            CrearVentaRequestDto request,
            List<UUID> detalleIds,
            BigDecimal total
    ) {
        // En BD, fn_venta_estado_inicial exige REGISTRADA para insertar y fn_detalle_venta_editable
        // exige REGISTRADA para insertar los detalles.
        Venta venta = new Venta(ventaId, usuarioId, request.observacion(), idempotencyKey, correlationId);
        venta.setEstado(VentaEstado.REGISTRADA);
        venta.setTotal(total);

        for (int i = 0; i < request.items().size(); i++) {
            CrearVentaItemDto itemDto = request.items().get(i);
            UUID detalleId = detalleIds.get(i);
            DetalleVenta detalle = new DetalleVenta(detalleId, venta, itemDto.productoId(), itemDto.cantidad(), itemDto.precioUnitario());
            venta.addItem(detalle);
        }

        // Guardamos inicialmente en estado REGISTRADA con sus detalles
        Venta guardada = ventaRepository.saveAndFlush(venta);

        // Transicionamos a CONFIRMADA requerida por negocio (fn_venta_transicion_estado)
        guardada.setEstado(VentaEstado.CONFIRMADA);
        guardada.setConfirmacionIdempotencyKey(idempotencyKey + "-CONFIRM");
        guardada.setConfirmadaAt(OffsetDateTime.now());

        return ventaRepository.saveAndFlush(guardada);
    }

    /**
     * HU-19: Listar ventas paginadas con filtros opcionales.
     */
    @Transactional(readOnly = true)
    public PageResponseDto<VentaResumenDto> listarVentas(
            String estado,
            LocalDate desde,
            LocalDate hasta,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int pageClean = Math.max(page, 0);
        int sizeClean = Math.min(Math.max(size, 1), 100);

        String sortField = (sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy)) ? sortBy : "fecha";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageClean, sizeClean, Sort.by(direction, sortField));

        Specification<Venta> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (estado != null && !estado.isBlank()) {
                try {
                    VentaEstado enumEstado = VentaEstado.valueOf(estado.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), enumEstado));
                } catch (IllegalArgumentException ignored) {
                    // Si el estado no coincide con enum, no coincidirá ninguna fila
                    predicates.add(cb.disjunction());
                }
            }

            if (desde != null) {
                OffsetDateTime desdeDateTime = desde.atStartOfDay(ZONE_LIMA).toOffsetDateTime();
                predicates.add(cb.greaterThanOrEqualTo(root.get("fecha"), desdeDateTime));
            }

            if (hasta != null) {
                OffsetDateTime hastaDateTime = hasta.plusDays(1).atStartOfDay(ZONE_LIMA).toOffsetDateTime();
                predicates.add(cb.lessThan(root.get("fecha"), hastaDateTime));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Venta> pageResult = ventaRepository.findAll(spec, pageable);

        List<VentaResumenDto> content = pageResult.getContent().stream()
                .map(this::mapearAVentaResumen)
                .toList();

        return new PageResponseDto<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    /**
     * HU-19: Consultar detalle de venta por ID.
     */
    @Transactional(readOnly = true)
    public VentaDetalleDto obtenerVentaPorId(UUID id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la venta con ID: " + id));
        return mapearAVentaDetalle(venta);
    }

    /**
     * HU-48: Anular una venta CONFIRMADA, reintegrando el stock de cada línea a MS-Inventario.
     * Idempotente: si la venta ya está ANULADA retorna el resultado sin volver a mover stock.
     */
    @Transactional
    public VentaDetalleDto anularVenta(
            UUID ventaId,
            String idempotencyKey,
            String motivo,
            UUID correlationId
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ValidacionException("El encabezado Idempotency-Key es obligatorio.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new ValidacionException("El motivo de anulación es obligatorio.");
        }

        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la venta con ID: " + ventaId));

        if (venta.getEstado() == VentaEstado.ANULADA) {
            log.info("La venta {} ya estaba anulada. Retornando resultado existente.", ventaId);
            return mapearAVentaDetalle(venta);
        }
        if (venta.getEstado() != VentaEstado.CONFIRMADA) {
            throw new ValidacionException("Solo se puede anular una venta CONFIRMADA. Estado actual: " + venta.getEstado());
        }

        String corrIdStr = correlationId != null ? correlationId.toString() : null;

        // Reintegrar stock por cada línea de la venta
        for (DetalleVenta item : venta.getItems()) {
            String claveEntrada = "venta-" + venta.getId() + "-anulacion-" + item.getId();
            MovimientoInventarioRequest mov = new MovimientoInventarioRequest(
                    item.getProductoId(),
                    item.getCantidad(),
                    "Anulación de venta",
                    "venta",
                    venta.getId(),
                    item.getId()
            );
            inventarioClient.registrarEntrada(mov, claveEntrada, corrIdStr);
        }

        venta.setEstado(VentaEstado.ANULADA);
        venta.setAnulacionIdempotencyKey(idempotencyKey.trim());
        venta.setMotivoAnulacion(motivo.trim());
        venta.setAnuladaAt(OffsetDateTime.now());

        Venta actualizada = ventaRepository.saveAndFlush(venta);
        log.info("Venta {} anulada. Motivo: {}", actualizada.getId(), actualizada.getMotivoAnulacion());
        return mapearAVentaDetalle(actualizada);
    }

    private void validarRequest(CrearVentaRequestDto request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new ValidacionException("La venta debe contener al menos un ítem.");
        }

        Set<UUID> productosVistos = new HashSet<>();
        for (CrearVentaItemDto item : request.items()) {
            if (item.productoId() == null) {
                throw new ValidacionException("El productoId es obligatorio en cada línea.");
            }
            if (!productosVistos.add(item.productoId())) {
                throw new ValidacionException("No se permiten productos repetidos en una misma venta. Producto duplicado: " + item.productoId());
            }
            if (item.cantidad() == null || item.cantidad().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidacionException("La cantidad debe ser mayor a 0.");
            }
            if (item.precioUnitario() == null || item.precioUnitario().compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidacionException("El precioUnitario debe ser mayor o igual a 0.");
            }
        }
    }

    private boolean verificarCoincidenciaPayload(Venta venta, CrearVentaRequestDto request) {
        if (venta.getItems().size() != request.items().size()) {
            return false;
        }
        for (CrearVentaItemDto reqItem : request.items()) {
            boolean encontrado = venta.getItems().stream().anyMatch(dbItem ->
                    dbItem.getProductoId().equals(reqItem.productoId()) &&
                    dbItem.getCantidad().compareTo(reqItem.cantidad()) == 0 &&
                    dbItem.getPrecioUnitario().compareTo(reqItem.precioUnitario()) == 0
            );
            if (!encontrado) {
                return false;
            }
        }
        return true;
    }

    private VentaResumenDto mapearAVentaResumen(Venta v) {
        return new VentaResumenDto(
                v.getId(),
                v.getFecha(),
                v.getEstado().name(),
                v.getTotal(),
                v.getObservacion(),
                v.getItems().size(),
                v.getUsuarioId()
        );
    }

    private VentaDetalleDto mapearAVentaDetalle(Venta v) {
        List<DetalleVentaDto> itemsDto = v.getItems().stream()
                .map(i -> new DetalleVentaDto(
                        i.getId(),
                        i.getProductoId(),
                        i.getCantidad(),
                        i.getPrecioUnitario(),
                        i.getSubtotalCalculado()
                ))
                .toList();

        return new VentaDetalleDto(
                v.getId(),
                v.getUsuarioId(),
                v.getEstado().name(),
                v.getFecha(),
                v.getTotal(),
                v.getObservacion(),
                itemsDto,
                v.getConfirmadaAt(),
                v.getAnuladaAt(),
                v.getMotivoAnulacion(),
                v.getCreatedAt(),
                v.getUpdatedAt()
        );
    }
}
