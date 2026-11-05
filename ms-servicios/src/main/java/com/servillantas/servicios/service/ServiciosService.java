package com.servillantas.servicios.service;

import com.servillantas.servicios.client.InventarioClient;
import com.servillantas.servicios.client.MovimientoInventarioRequest;
import com.servillantas.servicios.domain.MaterialServicio;
import com.servillantas.servicios.domain.Servicio;
import com.servillantas.servicios.domain.ServicioEstado;
import com.servillantas.servicios.domain.TipoServicio;
import com.servillantas.servicios.dto.*;
import com.servillantas.servicios.exception.IdempotencyConflictException;
import com.servillantas.servicios.exception.RecursoNoEncontradoException;
import com.servillantas.servicios.exception.ValidacionException;
import com.servillantas.servicios.repository.MaterialServicioRepository;
import com.servillantas.servicios.repository.ServicioRepository;
import com.servillantas.servicios.repository.TipoServicioRepository;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class ServiciosService {

    private static final Logger log = LoggerFactory.getLogger(ServiciosService.class);
    private static final ZoneId ZONE_LIMA = ZoneId.of("America/Lima");
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("fecha", "precio", "estado", "createdAt");

    private final TipoServicioRepository tipoServicioRepository;
    private final ServicioRepository servicioRepository;
    private final MaterialServicioRepository materialServicioRepository;
    private final InventarioClient inventarioClient;

    public ServiciosService(
            TipoServicioRepository tipoServicioRepository,
            ServicioRepository servicioRepository,
            MaterialServicioRepository materialServicioRepository,
            InventarioClient inventarioClient
    ) {
        this.tipoServicioRepository = tipoServicioRepository;
        this.servicioRepository = servicioRepository;
        this.materialServicioRepository = materialServicioRepository;
        this.inventarioClient = inventarioClient;
    }

    public record RegistroServicioResult(ServicioDetalleDto servicio, boolean replayed) {}
    public record RegistroMaterialResult(MaterialServicioDto material, boolean replayed) {}

    /**
     * HU-20: Consulta de tipos de servicio. Si {@code activo} es null se listan todos.
     */
    @Transactional(readOnly = true)
    public List<TipoServicioDto> listarTiposServicio(Boolean activo) {
        List<TipoServicio> tipos = (activo == null)
                ? tipoServicioRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre"))
                : tipoServicioRepository.findByActivo(activo);
        return tipos.stream().map(this::mapearATipoServicioDto).toList();
    }

    /**
     * HU-23: Crear un nuevo tipo de servicio del catálogo.
     */
    @Transactional
    public TipoServicioDto crearTipoServicio(CrearTipoServicioRequestDto request) {
        String nombre = request.nombre() != null ? request.nombre().trim() : "";
        if (nombre.isEmpty()) {
            throw new ValidacionException("El nombre del tipo de servicio es obligatorio.");
        }
        if (tipoServicioRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ValidacionException("Ya existe un tipo de servicio con el nombre: " + nombre);
        }
        if (request.precioReferencial() != null && request.precioReferencial().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidacionException("El precio referencial debe ser mayor o igual a 0.");
        }

        boolean activo = request.activo() == null || request.activo();
        TipoServicio tipo = new TipoServicio(UUID.randomUUID(), nombre,
                request.descripcion() != null ? request.descripcion().trim() : null,
                request.precioReferencial(), activo);
        return mapearATipoServicioDto(tipoServicioRepository.save(tipo));
    }

    /**
     * HU-23: Editar un tipo de servicio existente.
     */
    @Transactional
    public TipoServicioDto actualizarTipoServicio(UUID id, ActualizarTipoServicioRequestDto request) {
        TipoServicio tipo = tipoServicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de servicio no encontrado: " + id));

        if (request.nombre() != null && !request.nombre().trim().isEmpty()) {
            String nombre = request.nombre().trim();
            if (!nombre.equalsIgnoreCase(tipo.getNombre())
                    && tipoServicioRepository.existsByNombreIgnoreCase(nombre)) {
                throw new ValidacionException("Ya existe un tipo de servicio con el nombre: " + nombre);
            }
            tipo.setNombre(nombre);
        }
        if (request.descripcion() != null) {
            tipo.setDescripcion(request.descripcion().trim().isEmpty() ? null : request.descripcion().trim());
        }
        if (request.precioReferencial() != null) {
            if (request.precioReferencial().compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidacionException("El precio referencial debe ser mayor o igual a 0.");
            }
            tipo.setPrecioReferencial(request.precioReferencial());
        }
        if (request.activo() != null) {
            tipo.setActivo(request.activo());
        }
        return mapearATipoServicioDto(tipoServicioRepository.save(tipo));
    }

    /**
     * HU-23: Activar o desactivar un tipo de servicio. Si {@code activo} es null se alterna el estado.
     */
    @Transactional
    public TipoServicioDto cambiarEstadoTipoServicio(UUID id, Boolean activo) {
        TipoServicio tipo = tipoServicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de servicio no encontrado: " + id));
        tipo.setActivo(activo != null ? activo : !tipo.isActivo());
        return mapearATipoServicioDto(tipoServicioRepository.save(tipo));
    }

    /**
     * HU-20: Registrar nuevo servicio con tipo y precio.
     */
    @Transactional
    public RegistroServicioResult registrarServicio(
            CrearServicioRequestDto request,
            String idempotencyKey,
            UUID correlationId,
            UUID usuarioId
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ValidacionException("El encabezado Idempotency-Key es obligatorio.");
        }

        // 1. Idempotencia
        Optional<Servicio> existenteOpt = servicioRepository.findByIdempotencyKey(idempotencyKey);
        if (existenteOpt.isPresent()) {
            Servicio existente = existenteOpt.get();
            if (verificarCoincidenciaServicio(existente, request)) {
                log.info("Petición idempotente repetida con Idempotency-Key {}. Retornando servicio existente.", idempotencyKey);
                return new RegistroServicioResult(mapearAServicioDetalle(existente), true);
            } else {
                throw new IdempotencyConflictException("La Idempotency-Key ya fue usada previamente con otro contenido.");
            }
        }

        // 2. Validación de tipo de servicio y precio
        TipoServicio tipoServicio = tipoServicioRepository.findById(request.tipoServicioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de servicio no encontrado: " + request.tipoServicioId()));

        if (!tipoServicio.isActivo()) {
            throw new ValidacionException("El tipo de servicio especificado no está activo.");
        }

        if (request.precio() == null || request.precio().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidacionException("El precio debe ser mayor o igual a 0.");
        }

        OffsetDateTime fechaServicio = request.fecha() != null ? request.fecha() : OffsetDateTime.now();

        UUID servicioId = UUID.randomUUID();
        Servicio servicio = new Servicio(
                servicioId,
                tipoServicio,
                usuarioId,
                request.precio(),
                fechaServicio,
                request.observacion(),
                idempotencyKey,
                correlationId
        );

        try {
            Servicio guardado = servicioRepository.saveAndFlush(servicio);
            return new RegistroServicioResult(mapearAServicioDetalle(guardado), false);
        } catch (DataIntegrityViolationException dive) {
            Optional<Servicio> carrera = servicioRepository.findByIdempotencyKey(idempotencyKey);
            if (carrera.isPresent()) {
                if (verificarCoincidenciaServicio(carrera.get(), request)) {
                    return new RegistroServicioResult(mapearAServicioDetalle(carrera.get()), true);
                }
                throw new IdempotencyConflictException("Conflicto de Idempotency-Key en concurrencia.");
            }
            throw dive;
        }
    }

    /**
     * HU-21: Registrar material usado en un servicio y descontarlo de inventario.
     */
    @Transactional
    public RegistroMaterialResult agregarMaterial(
            UUID servicioId,
            CrearMaterialRequestDto request,
            String idempotencyKey,
            UUID correlationId
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ValidacionException("El encabezado Idempotency-Key es obligatorio.");
        }

        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el servicio con ID: " + servicioId));

        if (servicio.getEstado() == ServicioEstado.ANULADO) {
            throw new ValidacionException("No se pueden agregar materiales a un servicio anulado.");
        }

        // 1. Idempotencia a nivel de material
        Optional<MaterialServicio> materialExistenteOpt = materialServicioRepository.findByIdempotencyKey(idempotencyKey);
        if (materialExistenteOpt.isPresent()) {
            MaterialServicio matExistente = materialExistenteOpt.get();
            if (matExistente.getServicio().getId().equals(servicioId)
                    && matExistente.getProductoId().equals(request.productoId())
                    && matExistente.getCantidad().compareTo(request.cantidad()) == 0) {
                log.info("Petición idempotente repetida de material con Idempotency-Key {}.", idempotencyKey);
                return new RegistroMaterialResult(mapearAMaterialDto(matExistente), true);
            } else {
                throw new IdempotencyConflictException("La Idempotency-Key de material ya fue usada con otro contenido.");
            }
        }

        // 2. Validación de producto duplicado en el mismo servicio (restricción uq_material_servicio_producto)
        if (materialServicioRepository.existsByServicioIdAndProductoId(servicioId, request.productoId())) {
            throw new ValidacionException("El producto ya fue registrado como material en este servicio.");
        }

        if (request.cantidad() == null || request.cantidad().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidacionException("La cantidad de material debe ser mayor a 0.");
        }

        UUID materialId = UUID.randomUUID();
        String claveSalida = idempotencyKey + "-SALIDA";

        // 3. Descontar materiales de MS-Inventario
        MovimientoInventarioRequest mov = new MovimientoInventarioRequest(
                request.productoId(),
                request.cantidad(),
                "Uso en servicio",
                "servicio",
                servicioId,
                materialId
        );

        inventarioClient.registrarSalida(mov, claveSalida, correlationId != null ? correlationId.toString() : null);

        // 4. Persistir fila en materiales_servicio
        MaterialServicio material = new MaterialServicio(
                materialId,
                servicio,
                request.productoId(),
                request.cantidad(),
                idempotencyKey
        );

        try {
            MaterialServicio guardado = materialServicioRepository.saveAndFlush(material);
            return new RegistroMaterialResult(mapearAMaterialDto(guardado), false);
        } catch (DataIntegrityViolationException dive) {
            Optional<MaterialServicio> carrera = materialServicioRepository.findByIdempotencyKey(idempotencyKey);
            if (carrera.isPresent()) {
                return new RegistroMaterialResult(mapearAMaterialDto(carrera.get()), true);
            }
            throw dive;
        }
    }

    /**
     * HU-22: Consultar historial de servicios con filtros y paginación.
     */
    @Transactional(readOnly = true)
    public PageResponseDto<ServicioResumenDto> listarServicios(
            UUID tipoServicioId,
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

        Specification<Servicio> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (tipoServicioId != null) {
                predicates.add(cb.equal(root.get("tipoServicio").get("id"), tipoServicioId));
            }

            if (estado != null && !estado.isBlank()) {
                try {
                    ServicioEstado enumEstado = ServicioEstado.valueOf(estado.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("estado"), enumEstado));
                } catch (IllegalArgumentException ignored) {
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

        Page<Servicio> pageResult = servicioRepository.findAll(spec, pageable);

        List<ServicioResumenDto> content = pageResult.getContent().stream()
                .map(this::mapearAServicioResumen)
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
     * HU-22: Consultar detalle de servicio por ID.
     */
    @Transactional(readOnly = true)
    public ServicioDetalleDto obtenerServicioPorId(UUID id) {
        Servicio servicio = servicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el servicio con ID: " + id));
        return mapearAServicioDetalle(servicio);
    }

    /**
     * HU-49: Anular un servicio REALIZADO, reintegrando al inventario los materiales consumidos.
     * Idempotente: si ya está ANULADO retorna sin volver a mover stock.
     */
    @Transactional
    public ServicioDetalleDto anularServicio(
            UUID servicioId,
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

        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el servicio con ID: " + servicioId));

        if (servicio.getEstado() == ServicioEstado.ANULADO) {
            log.info("El servicio {} ya estaba anulado. Retornando resultado existente.", servicioId);
            return mapearAServicioDetalle(servicio);
        }
        if (servicio.getEstado() != ServicioEstado.REALIZADO) {
            throw new ValidacionException("Solo se puede anular un servicio REALIZADO. Estado actual: " + servicio.getEstado());
        }

        String corrIdStr = correlationId != null ? correlationId.toString() : null;

        // Reintegrar al inventario los materiales consumidos
        for (MaterialServicio material : servicio.getMateriales()) {
            String claveEntrada = "servicio-" + servicio.getId() + "-anulacion-" + material.getId();
            MovimientoInventarioRequest mov = new MovimientoInventarioRequest(
                    material.getProductoId(),
                    material.getCantidad(),
                    "Anulación de servicio",
                    "servicio",
                    servicio.getId(),
                    material.getId()
            );
            inventarioClient.registrarEntrada(mov, claveEntrada, corrIdStr);
        }

        servicio.setEstado(ServicioEstado.ANULADO);
        servicio.setAnulacionIdempotencyKey(idempotencyKey.trim());
        servicio.setMotivoAnulacion(motivo.trim());
        servicio.setAnuladaAt(OffsetDateTime.now());

        Servicio actualizado = servicioRepository.saveAndFlush(servicio);
        log.info("Servicio {} anulado. Motivo: {}", actualizado.getId(), actualizado.getMotivoAnulacion());
        return mapearAServicioDetalle(actualizado);
    }

    private TipoServicioDto mapearATipoServicioDto(TipoServicio t) {
        return new TipoServicioDto(
                t.getId(),
                t.getNombre(),
                t.getDescripcion(),
                t.getPrecioReferencial(),
                t.isActivo()
        );
    }

    private boolean verificarCoincidenciaServicio(Servicio s, CrearServicioRequestDto req) {
        return s.getTipoServicio().getId().equals(req.tipoServicioId())
                && s.getPrecio().compareTo(req.precio()) == 0;
    }

    private ServicioResumenDto mapearAServicioResumen(Servicio s) {
        return new ServicioResumenDto(
                s.getId(),
                s.getFecha(),
                s.getTipoServicio().getId(),
                s.getTipoServicio().getNombre(),
                s.getPrecio(),
                s.getEstado().name(),
                s.getObservacion(),
                s.getMateriales().size()
        );
    }

    private ServicioDetalleDto mapearAServicioDetalle(Servicio s) {
        List<MaterialServicioDto> matsDto = s.getMateriales().stream()
                .map(this::mapearAMaterialDto)
                .toList();

        return new ServicioDetalleDto(
                s.getId(),
                s.getTipoServicio().getId(),
                s.getTipoServicio().getNombre(),
                s.getUsuarioId(),
                s.getPrecio(),
                s.getFecha(),
                s.getObservacion(),
                s.getEstado().name(),
                s.getAnuladaAt(),
                s.getMotivoAnulacion(),
                matsDto,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    private MaterialServicioDto mapearAMaterialDto(MaterialServicio m) {
        return new MaterialServicioDto(
                m.getId(),
                m.getProductoId(),
                m.getCantidad(),
                m.getCreatedAt()
        );
    }
}
