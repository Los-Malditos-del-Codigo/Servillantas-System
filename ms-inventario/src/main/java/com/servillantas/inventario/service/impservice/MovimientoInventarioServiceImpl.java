package com.servillantas.inventario.service.impservice;

import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioRequest;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioResponse;
import com.servillantas.inventario.entity.AjusteInventario;
import com.servillantas.inventario.entity.Inventario;
import com.servillantas.inventario.entity.MovimientoInventario;
import com.servillantas.inventario.exception.BusinessRuleException;
import com.servillantas.inventario.exception.ResourceConflictException;
import com.servillantas.inventario.exception.ResourceNotFoundException;
import com.servillantas.inventario.mapper.MovimientoInventarioMapper;
import com.servillantas.inventario.repository.MovimientoInventarioRepository;
import com.servillantas.inventario.repository.InventarioRepository;
import com.servillantas.inventario.service.MovimientoInventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovimientoInventarioServiceImpl implements MovimientoInventarioService {

    private final MovimientoInventarioRepository movimientoRepository;
    private final InventarioRepository inventarioRepository;
    private final MovimientoInventarioMapper movimientoMapper;

    @Override
    @Transactional
    public MovimientoInventarioResponse registrar(MovimientoInventarioRequest request) {
        if (StringUtils.hasText(request.idempotencyKey())) {
            var movimientoExistente = movimientoRepository.findByIdempotencyKey(request.idempotencyKey());
            if (movimientoExistente.isPresent()) {
                return movimientoMapper.toResponse(movimientoExistente.get());
            }
        }

        if (!Set.of("MANUAL", "INICIAL").contains(request.origen())) {
            throw new BusinessRuleException(
                    "Los movimientos directos solo pueden tener origen MANUAL o INICIAL"
            );
        }
        if ("INICIAL".equals(request.origen()) && !"ENTRADA".equals(request.tipo())) {
            throw new BusinessRuleException("Un movimiento INICIAL debe ser de tipo ENTRADA");
        }
        if ("INICIAL".equals(request.origen())
                && movimientoRepository.existsByProductoIdAndOrigen(request.productoId(), "INICIAL")) {
            throw new ResourceConflictException("El producto ya tiene un movimiento de stock inicial");
        }

        return registrarInterno(request);
    }

    @Override
    @Transactional
    public MovimientoInventarioResponse registrarAjuste(AjusteInventario ajuste) {
        String tipoMovimiento = "AJUSTE_POSITIVO".equals(ajuste.getTipo()) ? "ENTRADA" : "SALIDA";
        MovimientoInventarioRequest request = new MovimientoInventarioRequest(
                ajuste.getProductoId(),
                ajuste.getUsuarioId(),
                tipoMovimiento,
                ajuste.getCantidad(),
                "AJUSTE",
                ajuste.getId(),
                "AJUSTE:" + ajuste.getId(),
                null,
                ajuste.getObservacion()
        );
        return registrarInterno(request);
    }

    private MovimientoInventarioResponse registrarInterno(MovimientoInventarioRequest request) {
        if (StringUtils.hasText(request.idempotencyKey())) {
            var movimientoExistente = movimientoRepository.findByIdempotencyKey(request.idempotencyKey());
            if (movimientoExistente.isPresent()) {
                return movimientoMapper.toResponse(movimientoExistente.get());
            }
        }

        Inventario inventario = inventarioRepository.findByProductoIdForUpdate(request.productoId())
                .orElseGet(() -> crearInventarioInicial(request.productoId()));
        BigDecimal stockAnterior = inventario.getStockActual();
        BigDecimal stockResultante = calcularStockResultante(stockAnterior, request.tipo(), request.cantidad());

        inventario.setStockActual(stockResultante);
        inventarioRepository.save(inventario);
        MovimientoInventario movimiento = movimientoMapper.toEntity(request);
        movimiento.setStockAnterior(stockAnterior);
        movimiento.setStockResultante(stockResultante);
        return movimientoMapper.toResponse(movimientoRepository.save(movimiento));
    }

    private Inventario crearInventarioInicial(UUID productoId) {
        return inventarioRepository.save(Inventario.builder()
                .productoId(productoId)
                .stockActual(BigDecimal.ZERO)
                .build());
    }

    private BigDecimal calcularStockResultante(BigDecimal stockAnterior, String tipo, BigDecimal cantidad) {
        BigDecimal stockResultante = switch (tipo) {
            case "ENTRADA" -> stockAnterior.add(cantidad);
            case "SALIDA" -> stockAnterior.subtract(cantidad);
            default -> throw new BusinessRuleException("El tipo de movimiento es inválido: " + tipo);
        };

        if (stockResultante.signum() < 0) {
            throw new BusinessRuleException("Stock insuficiente para realizar la salida");
        }
        return stockResultante;
    }

    @Override
    public MovimientoInventarioResponse obtenerPorId(UUID id) {
        MovimientoInventario movimiento = movimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Movimiento de inventario no encontrado con id: " + id
                ));

        return movimientoMapper.toResponse(movimiento);
    }

    @Override
    public List<MovimientoInventarioResponse> obtenerTodos() {
        return movimientoRepository.findAll()
                .stream()
                .map(movimientoMapper::toResponse)
                .toList();
    }

    @Override
    public List<MovimientoInventarioResponse> obtenerPorProducto(UUID productoId) {
        return movimientoRepository.findByProductoIdOrderByFechaCreacionDesc(productoId)
                .stream()
                .map(movimientoMapper::toResponse)
                .toList();
    }

    @Override
    public List<MovimientoInventarioResponse> obtenerPorProductoYTipo(
            UUID productoId,
            String tipo
    ) {
        return movimientoRepository
                .findByProductoIdAndTipoOrderByFechaCreacionDesc(productoId, tipo)
                .stream()
                .map(movimientoMapper::toResponse)
                .toList();
    }
}
