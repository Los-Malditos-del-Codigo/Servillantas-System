package com.servillantas.inventario.service.impservice;

import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioRequest;
import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioResponse;
import com.servillantas.inventario.entity.AjusteInventario;
import com.servillantas.inventario.exception.ResourceNotFoundException;
import com.servillantas.inventario.mapper.AjusteInventarioMapper;
import com.servillantas.inventario.repository.AjusteInventarioRepository;
import com.servillantas.inventario.service.AjusteInventarioService;
import com.servillantas.inventario.service.MovimientoInventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AjusteInventarioServiceImpl implements AjusteInventarioService {

    private final AjusteInventarioRepository ajusteInventarioRepository;
    private final AjusteInventarioMapper ajusteInventarioMapper;
    private final MovimientoInventarioService movimientoInventarioService;

    @Override
    @Transactional
    public AjusteInventarioResponse crear(AjusteInventarioRequest request) {
        if (StringUtils.hasText(request.idempotencyKey())) {
            var ajusteExistente = ajusteInventarioRepository
                    .findByIdempotencyKey(request.idempotencyKey());
            if (ajusteExistente.isPresent()) {
                return ajusteInventarioMapper.toResponse(ajusteExistente.get());
            }
        }

        AjusteInventario ajuste = ajusteInventarioMapper.toEntity(request);
        AjusteInventario ajusteGuardado = ajusteInventarioRepository.save(ajuste);
        movimientoInventarioService.registrarAjuste(ajusteGuardado);
        return ajusteInventarioMapper.toResponse(ajusteGuardado);
    }

    @Override
    public AjusteInventarioResponse obtenerPorId(UUID id) {
        return ajusteInventarioMapper.toResponse(buscarPorId(id));
    }

    @Override
    public List<AjusteInventarioResponse> obtenerTodos() {
        return ajusteInventarioRepository.findAll().stream()
                .map(ajusteInventarioMapper::toResponse)
                .toList();
    }

    @Override
    public List<AjusteInventarioResponse> obtenerPorProductoId(UUID productoId) {
        return ajusteInventarioRepository.findByProductoIdOrderByFechaCreacionDesc(productoId)
                .stream()
                .map(ajusteInventarioMapper::toResponse)
                .toList();
    }

    @Override
    public List<AjusteInventarioResponse> obtenerPorUsuarioId(UUID usuarioId) {
        return ajusteInventarioRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId)
                .stream()
                .map(ajusteInventarioMapper::toResponse)
                .toList();
    }

    private AjusteInventario buscarPorId(UUID id) {
        return ajusteInventarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ajuste de inventario no encontrado con id: " + id
                ));
    }
}
