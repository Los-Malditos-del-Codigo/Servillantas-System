package com.servillantas.inventario.service.impservice;

import com.servillantas.inventario.dto.inventario.InventarioRequest;
import com.servillantas.inventario.dto.inventario.InventarioResponse;
import com.servillantas.inventario.entity.Inventario;
import com.servillantas.inventario.exception.BusinessRuleException;
import com.servillantas.inventario.exception.ResourceConflictException;
import com.servillantas.inventario.exception.ResourceNotFoundException;
import com.servillantas.inventario.mapper.InventarioMapper;
import com.servillantas.inventario.repository.InventarioRepository;
import com.servillantas.inventario.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventarioServiceImpl implements InventarioService {

    private final InventarioRepository inventarioRepository;
    private final InventarioMapper inventarioMapper;

    @Override
    public InventarioResponse crear(InventarioRequest request) {
        if (request.stockActual().signum() != 0) {
            throw new BusinessRuleException(
                    "El inventario debe crearse con stock cero; use un movimiento INICIAL para registrar el stock inicial"
            );
        }

        if (inventarioRepository.existsByProductoId(request.productoId())) {
            throw new ResourceConflictException(
                    "Ya existe un inventario para el producto: " + request.productoId()
            );
        }

        Inventario inventario = inventarioMapper.toEntity(request);
        return inventarioMapper.toResponse(inventarioRepository.save(inventario));
    }

    @Override
    public InventarioResponse obtenerPorId(UUID id) {
        return inventarioMapper.toResponse(buscarPorId(id));
    }

    @Override
    public InventarioResponse obtenerPorProductoId(UUID productoId) {
        Inventario inventario = inventarioRepository.findByProductoId(productoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventario no encontrado para el producto: " + productoId
                ));
        return inventarioMapper.toResponse(inventario);
    }

    @Override
    public List<InventarioResponse> obtenerTodos() {
        return inventarioRepository.findAll().stream()
                .map(inventarioMapper::toResponse)
                .toList();
    }

    private Inventario buscarPorId(UUID id) {
        return inventarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventario no encontrado con id: " + id
                ));
    }
}
