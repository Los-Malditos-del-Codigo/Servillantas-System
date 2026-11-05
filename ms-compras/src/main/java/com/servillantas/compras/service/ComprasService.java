package com.servillantas.compras.service;

import com.servillantas.compras.client.InventarioClient;
import com.servillantas.compras.client.MovimientoInventarioRequest;
import com.servillantas.compras.config.UsuarioActualProvider;
import com.servillantas.compras.domain.Compra;
import com.servillantas.compras.domain.DetalleCompra;
import com.servillantas.compras.domain.Proveedor;
import com.servillantas.compras.dto.*;
import com.servillantas.compras.exception.*;
import com.servillantas.compras.repository.CompraRepository;
import com.servillantas.compras.repository.DetalleCompraRepository;
import com.servillantas.compras.repository.ProductoRepository;
import com.servillantas.compras.repository.ProveedorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ComprasService {

    private static final Logger log = LoggerFactory.getLogger(ComprasService.class);

    private final CompraRepository compraRepository;
    private final DetalleCompraRepository detalleCompraRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final InventarioClient inventarioClient;
    private final UsuarioActualProvider usuarioActualProvider;

    public ComprasService(
            CompraRepository compraRepository,
            DetalleCompraRepository detalleCompraRepository,
            ProveedorRepository proveedorRepository,
            ProductoRepository productoRepository,
            InventarioClient inventarioClient,
            UsuarioActualProvider usuarioActualProvider
    ) {
        this.compraRepository = compraRepository;
        this.detalleCompraRepository = detalleCompraRepository;
        this.proveedorRepository = proveedorRepository;
        this.productoRepository = productoRepository;
        this.inventarioClient = inventarioClient;
        this.usuarioActualProvider = usuarioActualProvider;
    }

    /**
     * HU-16: Registrar compras o reposiciones
     * Header Idempotency-Key obligatorio.
     * No modifica inventario en este paso.
     */
    @Transactional
    public CompraDetalleDto crearCompra(CrearCompraRequestDto dto, String idempotencyKey, UUID correlationId) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new ValidacionException("La cabecera Idempotency-Key es obligatoria para registrar una compra");
        }
        String cleanIdempotencyKey = idempotencyKey.trim();

        // 1. Verificación de Idempotencia previa
        Optional<Compra> existenteOpt = compraRepository.findByIdempotencyKey(cleanIdempotencyKey);
        if (existenteOpt.isPresent()) {
            Compra existente = existenteOpt.get();
            if (esMismoContenido(existente, dto)) {
                log.info("Petición idempotente detectada para compra {}. Devolviendo resultado existente.", existente.getId());
                return toDetalleDto(existente);
            } else {
                throw new IdempotencyConflictException("La clave de idempotencia ya fue utilizada con una petición diferente");
            }
        }

        // 2. Validar existencia y estado del Proveedor
        Proveedor proveedor = proveedorRepository.findById(dto.proveedorId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor no encontrado con ID: " + dto.proveedorId()));

        if (Boolean.FALSE.equals(proveedor.getActivo())) {
            throw new ValidacionException("El proveedor seleccionado está inactivo y no puede recibir nuevas compras");
        }

        // 3. Validar líneas de compra (items)
        if (dto.items() == null || dto.items().isEmpty()) {
            throw new ValidacionException("La compra debe contener al menos una línea de producto");
        }

        Set<UUID> productosUnicos = new HashSet<>();
        for (CrearCompraItemDto item : dto.items()) {
            if (item.productoId() == null) {
                throw new ValidacionException("El producto_id es obligatorio en cada línea");
            }
            if (!productosUnicos.add(item.productoId())) {
                throw new ValidacionException("No se permiten productos repetidos en la misma compra. Producto ID: " + item.productoId());
            }
            if (item.cantidad() == null || item.cantidad().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidacionException("La cantidad debe ser mayor a 0 para el producto: " + item.productoId());
            }
            if (item.costoUnitario() == null || item.costoUnitario().compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidacionException("El costo unitario no puede ser negativo para el producto: " + item.productoId());
            }
        }

        BigDecimal totalCalculado = BigDecimal.ZERO;
        for (CrearCompraItemDto item : dto.items()) {
            // Validar existencia de producto activo en catálogo
            if (!productoRepository.existsByIdAndActivoTrue(item.productoId())) {
                throw new RecursoNoEncontradoException("Producto no encontrado o inactivo en inventario: " + item.productoId());
            }

            BigDecimal subtotal = item.cantidad().multiply(item.costoUnitario()).setScale(2, RoundingMode.HALF_UP);
            totalCalculado = totalCalculado.add(subtotal);
        }

        // 4. Identidad del usuario autenticado
        UUID usuarioId = usuarioActualProvider.getUsuarioId();

        // 5. Construcción de entidad Compra y DetalleCompra
        Compra compra = new Compra(
                UUID.randomUUID(),
                proveedor,
                usuarioId,
                cleanIdempotencyKey,
                dto.observacion(),
                correlationId
        );
        compra.setTotal(totalCalculado);

        for (CrearCompraItemDto itemDto : dto.items()) {
            DetalleCompra detalle = new DetalleCompra(
                    UUID.randomUUID(),
                    compra,
                    itemDto.productoId(),
                    itemDto.cantidad(),
                    itemDto.costoUnitario()
            );
            compra.addItem(detalle);
        }

        Compra guardada = compraRepository.save(compra);
        log.info("Compra registrada con ID {} en estado REGISTRADA. Total: S/ {}", guardada.getId(), guardada.getTotal());
        return toDetalleDto(guardada);
    }

    /**
     * HU-17: Consultar historial de compras (listado paginado con filtros)
     */
    @Transactional(readOnly = true)
    public PageResponseDto<CompraResumenDto> listarCompras(
            UUID proveedorId,
            String estado,
            OffsetDateTime fechaInicio,
            OffsetDateTime fechaFin,
            Pageable pageable
    ) {
        int pageSize = Math.min(pageable.getPageSize(), 100);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "fecha");
        Pageable paginaAjustada = PageRequest.of(pageable.getPageNumber(), pageSize, sort);

        String estadoFiltro = (estado != null && !estado.trim().isEmpty()) ? estado.trim().toUpperCase() : null;
        Page<Compra> pagina = compraRepository.findByFiltros(proveedorId, estadoFiltro, fechaInicio, fechaFin, paginaAjustada);

        Page<CompraResumenDto> paginaDto = pagina.map(this::toResumenDto);
        return PageResponseDto.from(paginaDto);
    }

    /**
     * HU-17: Consultar detalle de una compra específica
     */
    @Transactional(readOnly = true)
    public CompraDetalleDto obtenerCompraPorId(UUID id) {
        Compra compra = compraRepository.findByIdWithDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Compra no encontrada con ID: " + id));
        return toDetalleDto(compra);
    }

    /**
     * HU-46: Confirmar recepción de una compra
     * Header Idempotency-Key obligatorio.
     * Genera entrada de inventario vía MS-Inventario con claves determinísticas por detalle.
     */
    @Transactional
    public CompraDetalleDto confirmarRecepcion(UUID compraId, String idempotencyKey, UUID correlationId) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new ValidacionException("La cabecera Idempotency-Key es obligatoria para confirmar la recepción");
        }
        String cleanIdempotencyKey = idempotencyKey.trim();

        // 1. Bloqueo pesimista para evitar carreras o doble recepción concurrente
        Compra compra = compraRepository.findByIdWithLock(compraId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Compra no encontrada con ID: " + compraId));

        // 2. Si ya está RECIBIDA: comportamiento idempotente
        if ("RECIBIDA".equalsIgnoreCase(compra.getEstado())) {
            log.info("La compra {} ya fue recibida previamente con clave de recepción {}. Retornando resultado.",
                    compra.getId(), compra.getRecepcionIdempotencyKey());
            return toDetalleDto(compra);
        }

        // 3. Si está ANULADA u otro estado incompatible: conflicto
        if ("ANULADA".equalsIgnoreCase(compra.getEstado())) {
            throw new EstadoInvalidoException("La compra está ANULADA y no puede ser recibida");
        }

        if (!"REGISTRADA".equalsIgnoreCase(compra.getEstado())) {
            throw new EstadoInvalidoException("La compra se encuentra en estado " + compra.getEstado() + " y no permite confirmación de recepción");
        }

        // 4. Cargar ítems
        List<DetalleCompra> items = compra.getItems();
        if (items.isEmpty()) {
            items = detalleCompraRepository.findByCompraId(compra.getId());
        }

        if (items.isEmpty()) {
            throw new ValidacionException("La compra no tiene ítems para recibir");
        }

        // 5. Registrar entrada en MS-Inventario con clave determinística por compra y detalle
        String corrStr = correlationId != null ? correlationId.toString() : (compra.getCorrelationId() != null ? compra.getCorrelationId().toString() : null);

        for (DetalleCompra item : items) {
            String itemDeterministicKey = "compra-" + compra.getId() + "-item-" + item.getId();
            MovimientoInventarioRequest request = new MovimientoInventarioRequest(
                    item.getProductoId(),
                    item.getCantidad(),
                    "Recepción de compra " + compra.getId(),
                    "COMPRA",
                    compra.getId(),
                    item.getId()
            );

            log.info("Invocando MS-Inventario para producto {} cantidad {} con clave determinística {}",
                    item.getProductoId(), item.getCantidad(), itemDeterministicKey);
            inventarioClient.registrarEntrada(request, itemDeterministicKey, corrStr);
        }

        // 6. Actualizar estado local a RECIBIDA tras confirmación remota exitosa
        compra.setEstado("RECIBIDA");
        compra.setRecepcionIdempotencyKey(cleanIdempotencyKey);
        compra.setRecibidaAt(OffsetDateTime.now());

        Compra actualizada = compraRepository.save(compra);
        log.info("Compra {} confirmada y marcada como RECIBIDA exitosamente.", actualizada.getId());
        return toDetalleDto(actualizada);
    }

    /**
     * HU-47: Anular una compra REGISTRADA (aún no recibida).
     * No modifica inventario porque todavía no se generaron entradas.
     */
    @Transactional
    public CompraDetalleDto anularCompra(UUID compraId, String motivo) {
        if (motivo == null || motivo.trim().isEmpty()) {
            throw new ValidacionException("El motivo de anulación es obligatorio");
        }

        Compra compra = compraRepository.findByIdWithLock(compraId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Compra no encontrada con ID: " + compraId));

        if ("ANULADA".equalsIgnoreCase(compra.getEstado())) {
            log.info("La compra {} ya estaba anulada. Retornando resultado existente.", compra.getId());
            return toDetalleDto(compra);
        }

        if (!"REGISTRADA".equalsIgnoreCase(compra.getEstado())) {
            throw new EstadoInvalidoException("Solo se puede anular una compra REGISTRADA. Estado actual: " + compra.getEstado());
        }

        compra.setEstado("ANULADA");
        compra.setMotivoAnulacion(motivo.trim());
        compra.setAnuladaAt(OffsetDateTime.now());

        Compra actualizada = compraRepository.save(compra);
        log.info("Compra {} anulada. Motivo: {}", actualizada.getId(), actualizada.getMotivoAnulacion());
        return toDetalleDto(actualizada);
    }

    private boolean esMismoContenido(Compra existente, CrearCompraRequestDto dto) {
        if (!existente.getProveedor().getId().equals(dto.proveedorId())) {
            return false;
        }
        List<DetalleCompra> items = existente.getItems();
        if (items.size() != dto.items().size()) {
            return false;
        }

        Map<UUID, CrearCompraItemDto> mapaDto = new HashMap<>();
        for (CrearCompraItemDto i : dto.items()) {
            mapaDto.put(i.productoId(), i);
        }

        for (DetalleCompra detalle : items) {
            CrearCompraItemDto itemDto = mapaDto.get(detalle.getProductoId());
            if (itemDto == null) {
                return false;
            }
            if (detalle.getCantidad().compareTo(itemDto.cantidad()) != 0) {
                return false;
            }
            if (detalle.getCostoUnitario().compareTo(itemDto.costoUnitario()) != 0) {
                return false;
            }
        }
        return true;
    }

    // Conversiones explícitas de entidades a DTOs (sin mappers externos)
    private CompraResumenDto toResumenDto(Compra c) {
        ProveedorResumenDto provDto = new ProveedorResumenDto(
                c.getProveedor().getId(),
                c.getProveedor().getNombre(),
                c.getProveedor().getRuc()
        );
        return new CompraResumenDto(
                c.getId(),
                provDto,
                c.getUsuarioId(),
                c.getEstado(),
                c.getFecha(),
                c.getTotal(),
                c.getObservacion(),
                c.getRecibidaAt(),
                c.getAnuladaAt(),
                c.getCreatedAt()
        );
    }

    private CompraDetalleDto toDetalleDto(Compra c) {
        ProveedorResumenDto provDto = new ProveedorResumenDto(
                c.getProveedor().getId(),
                c.getProveedor().getNombre(),
                c.getProveedor().getRuc()
        );
        List<DetalleCompraDto> itemsDto = c.getItems().stream()
                .map(d -> new DetalleCompraDto(
                        d.getId(),
                        d.getProductoId(),
                        d.getCantidad(),
                        d.getCostoUnitario(),
                        d.getSubtotal()
                ))
                .toList();

        return new CompraDetalleDto(
                c.getId(),
                provDto,
                c.getUsuarioId(),
                c.getEstado(),
                c.getFecha(),
                c.getTotal(),
                c.getObservacion(),
                c.getMotivoAnulacion(),
                c.getRecibidaAt(),
                c.getAnuladaAt(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                itemsDto
        );
    }
}
