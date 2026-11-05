package com.servillantas.inventario.service.impservice;

import com.servillantas.inventario.client.AutenticacionClient;
import com.servillantas.inventario.dto.kardex.InventarioStockResponse;
import com.servillantas.inventario.dto.kardex.MovimientoKardexResponse;
import com.servillantas.inventario.dto.kardex.RegistrarEntradaRequest;
import com.servillantas.inventario.dto.kardex.RegistrarSalidaRequest;
import com.servillantas.inventario.dto.kardex.RegistroInventarioResponse;
import com.servillantas.inventario.entity.Inventario;
import com.servillantas.inventario.entity.MovimientoInventario;
import com.servillantas.inventario.exception.BusinessRuleException;
import com.servillantas.inventario.exception.ResourceNotFoundException;
import com.servillantas.inventario.repository.InventarioRepository;
import com.servillantas.inventario.repository.MovimientoInventarioRepository;
import com.servillantas.inventario.security.JwtUsuarioResolver;
import com.servillantas.inventario.service.InventarioKardexService;
import com.servillantas.inventario.service.MotivoOrigenMapper;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventarioKardexServiceImpl implements InventarioKardexService {

    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final AutenticacionClient autenticacionClient;

    @Override
    @Transactional(readOnly = true)
    public List<InventarioStockResponse> obtenerStock() {
        return inventarioRepository.findAll().stream()
                .map(this::toStock)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InventarioStockResponse obtenerStockPorProducto(UUID productoId) {
        Inventario inventario = inventarioRepository.findByProductoId(productoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventario no encontrado para el producto: " + productoId));
        return toStock(inventario);
    }

    @Override
    @Transactional
    public RegistroInventarioResponse registrarEntrada(RegistrarEntradaRequest request, JwtUsuarioResolver.Usuario usuario) {
        Inventario inventario = obtenerOCrearInventario(request.productoId());
        BigDecimal anterior = inventario.getStockActual();
        BigDecimal posterior = anterior.add(request.cantidad());
        inventario.setStockActual(posterior);
        inventarioRepository.save(inventario);

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .productoId(request.productoId())
                .usuarioId(parseUuid(usuario.id()))
                .tipo("ENTRADA")
                .cantidad(request.cantidad())
                .stockAnterior(anterior)
                .stockResultante(posterior)
                .origen(MotivoOrigenMapper.origenEntrada(request.motivo()))
                .observacion(resolverObservacion(request.observaciones(), request.proveedor()))
                .build();
        MovimientoInventario guardado = movimientoRepository.save(movimiento);

        return new RegistroInventarioResponse(
                toMovimiento(guardado, request.motivo(), request.costoUnitario(), usuario.nombres()),
                toStock(inventario));
    }

    @Override
    @Transactional
    public RegistroInventarioResponse registrarSalida(RegistrarSalidaRequest request, JwtUsuarioResolver.Usuario usuario) {
        Inventario inventario = inventarioRepository.findByProductoIdForUpdate(request.productoId())
                .orElseThrow(() -> new BusinessRuleException(
                        "No existe inventario para el producto: " + request.productoId()));

        BigDecimal anterior = inventario.getStockActual();
        if (anterior.compareTo(request.cantidad()) < 0) {
            throw new BusinessRuleException(
                    "Stock insuficiente. Disponible actual: " + anterior.stripTrailingZeros().toPlainString());
        }
        BigDecimal posterior = anterior.subtract(request.cantidad());
        inventario.setStockActual(posterior);
        inventarioRepository.save(inventario);

        MovimientoInventario movimiento = MovimientoInventario.builder()
                .productoId(request.productoId())
                .usuarioId(parseUuid(usuario.id()))
                .tipo("SALIDA")
                .cantidad(request.cantidad())
                .stockAnterior(anterior)
                .stockResultante(posterior)
                .origen(MotivoOrigenMapper.origenSalida(request.motivo()))
                .observacion(limpiar(request.observaciones()))
                .build();
        MovimientoInventario guardado = movimientoRepository.save(movimiento);

        return new RegistroInventarioResponse(
                toMovimiento(guardado, request.motivo(), null, usuario.nombres()),
                toStock(inventario));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoKardexResponse> listarMovimientos(UUID productoId, String tipo,
                                                            LocalDate fechaDesde, LocalDate fechaHasta,
                                                            String authorization) {
        String tipoDb = (tipo != null && !tipo.isBlank()) ? tipo.trim().toUpperCase(Locale.ROOT) : null;
        OffsetDateTime desde = fechaDesde == null ? null
                : fechaDesde.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime hasta = fechaHasta == null ? null
                : fechaHasta.plusDays(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();

        Specification<MovimientoInventario> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (productoId != null) {
                predicates.add(cb.equal(root.get("productoId"), productoId));
            }
            if (tipoDb != null) {
                predicates.add(cb.equal(root.get("tipo"), tipoDb));
            }
            if (desde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<OffsetDateTime>get("fechaCreacion"), desde));
            }
            if (hasta != null) {
                predicates.add(cb.lessThan(root.<OffsetDateTime>get("fechaCreacion"), hasta));
            }
            query.orderBy(cb.desc(root.get("fechaCreacion")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<MovimientoInventario> movimientos = movimientoRepository.findAll(spec);

        Set<UUID> usuarioIds = movimientos.stream()
                .map(MovimientoInventario::getUsuarioId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> nombres = new HashMap<>();
        for (UUID usuarioId : usuarioIds) {
            autenticacionClient.obtener(usuarioId, authorization)
                    .map(this::nombreCompleto)
                    .ifPresent(nombre -> nombres.put(usuarioId, nombre));
        }

        return movimientos.stream()
                .map(mov -> toMovimiento(mov, null, null, nombreUsuario(mov.getUsuarioId(), nombres)))
                .toList();
    }

    private Inventario obtenerOCrearInventario(UUID productoId) {
        return inventarioRepository.findByProductoIdForUpdate(productoId)
                .orElseGet(() -> inventarioRepository.save(Inventario.builder()
                        .productoId(productoId)
                        .stockActual(BigDecimal.ZERO)
                        .build()));
    }

    private InventarioStockResponse toStock(Inventario inventario) {
        return new InventarioStockResponse(
                inventario.getId(),
                inventario.getProductoId(),
                inventario.getStockActual(),
                inventario.getFechaActualizacion(),
                inventario.getFechaCreacion(),
                inventario.getFechaActualizacion());
    }

    private MovimientoKardexResponse toMovimiento(MovimientoInventario movimiento, String motivoOverride,
                                                  BigDecimal costoOverride, String registradoPor) {
        String tipo = movimiento.getTipo() == null ? null : movimiento.getTipo().toLowerCase(Locale.ROOT);
        String motivo = (motivoOverride != null && !motivoOverride.isBlank())
                ? motivoOverride
                : MotivoOrigenMapper.motivoLegible(movimiento.getOrigen());
        return new MovimientoKardexResponse(
                movimiento.getId(),
                movimiento.getProductoId(),
                tipo,
                movimiento.getCantidad(),
                movimiento.getStockAnterior(),
                movimiento.getStockResultante(),
                costoOverride,
                motivo,
                movimiento.getObservacion(),
                registradoPor,
                movimiento.getFechaCreacion());
    }

    private String resolverObservacion(String observaciones, String proveedor) {
        String obs = limpiar(observaciones);
        if (obs != null) {
            return obs;
        }
        String prov = limpiar(proveedor);
        return prov != null ? "Proveedor: " + prov : null;
    }

    private String limpiar(String valor) {
        if (valor == null) {
            return null;
        }
        String texto = valor.trim();
        return texto.isEmpty() ? null : texto;
    }

    private UUID parseUuid(String valor) {
        if (valor == null) {
            return null;
        }
        try {
            return UUID.fromString(valor);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String nombreCompleto(AutenticacionClient.PerfilInfo perfil) {
        String nombres = perfil.nombres() == null ? "" : perfil.nombres().trim();
        String apellidos = perfil.apellidos() == null ? "" : perfil.apellidos().trim();
        String completo = (nombres + " " + apellidos).trim();
        return completo.isEmpty() ? null : completo;
    }

    private String nombreUsuario(UUID usuarioId, Map<UUID, String> nombres) {
        if (usuarioId == null) {
            return "Sistema";
        }
        return Optional.ofNullable(nombres.get(usuarioId)).orElse(usuarioId.toString());
    }
}
