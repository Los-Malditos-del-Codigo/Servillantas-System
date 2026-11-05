package com.servillantas.producto.service.impservice;

import com.servillantas.producto.dto.unidadmedida.UnidadMedidaRequest;
import com.servillantas.producto.dto.unidadmedida.UnidadMedidaResponse;
import com.servillantas.producto.entity.UnidadMedida;
import com.servillantas.producto.exception.ResourceNotFoundException;
import com.servillantas.producto.mapper.UnidadMedidaMapper;
import com.servillantas.producto.repository.UnidadMedidaRepository;
import com.servillantas.producto.service.UnidadMedidaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UnidadMedidaServiceImpl implements UnidadMedidaService {

    private final UnidadMedidaRepository unidadMedidaRepository;
    private final UnidadMedidaMapper unidadMedidaMapper;

    @Override
    public UnidadMedidaResponse crear(UnidadMedidaRequest request) {
        UnidadMedida unidadMedida = unidadMedidaMapper.toEntity(request);

        if (unidadMedida.getActivo() == null) {
            unidadMedida.setActivo(true);
        }

        UnidadMedida unidadMedidaGuardada =
                unidadMedidaRepository.save(unidadMedida);

        return unidadMedidaMapper.toResponse(unidadMedidaGuardada);
    }

    @Override
    public UnidadMedidaResponse obtenerPorId(UUID id) {
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: " + id
                        )
                );

        return unidadMedidaMapper.toResponse(unidadMedida);
    }

    @Override
    public List<UnidadMedidaResponse> obtenerTodos() {
        return unidadMedidaRepository.findAll()
                .stream()
                .map(unidadMedidaMapper::toResponse)
                .toList();
    }

    @Override
    public UnidadMedidaResponse actualizar(
            UUID id,
            UnidadMedidaRequest request
    ) {
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: " + id
                        )
                );

        Boolean activoActual = unidadMedida.getActivo();

        unidadMedidaMapper.updateEntity(request, unidadMedida);

        if (request.activo() == null) {
            unidadMedida.setActivo(activoActual);
        }

        UnidadMedida unidadMedidaActualizada =
                unidadMedidaRepository.save(unidadMedida);

        return unidadMedidaMapper.toResponse(unidadMedidaActualizada);
    }

    @Override
    public UnidadMedidaResponse toggleActivo(UUID id) {
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: " + id
                        )
                );

        unidadMedida.setActivo(!Boolean.TRUE.equals(unidadMedida.getActivo()));

        return unidadMedidaMapper.toResponse(
                unidadMedidaRepository.save(unidadMedida)
        );
    }

    @Override
    @Transactional
    public void eliminar(UUID id) {
        UnidadMedida unidadMedida = unidadMedidaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: " + id
                        )
                );

        unidadMedidaRepository.delete(unidadMedida);
    }
}