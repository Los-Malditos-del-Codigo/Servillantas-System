package com.servillantas.producto.service.impservice;

import com.servillantas.producto.dto.marca.MarcaRequest;
import com.servillantas.producto.dto.marca.MarcaResponse;
import com.servillantas.producto.entity.Marca;
import com.servillantas.producto.exception.ResourceNotFoundException;
import com.servillantas.producto.mapper.MarcaMapper;
import com.servillantas.producto.repository.MarcaRepository;
import com.servillantas.producto.service.MarcaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MarcaServiceImpl implements MarcaService {

    private final MarcaRepository marcaRepository;
    private final MarcaMapper marcaMapper;

    @Override
    public MarcaResponse crear(MarcaRequest request) {

        Marca marca = marcaMapper.toEntity(request);

        if (marca.getActivo() == null) {
            marca.setActivo(true);
        }

        Marca guardada = marcaRepository.save(marca);

        return marcaMapper.toResponse(guardada);
    }

    @Override
    public MarcaResponse obtenerPorId(UUID id) {

        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Marca no encontrada con id: " + id
                        )
                );

        return marcaMapper.toResponse(marca);
    }

    @Override
    public List<MarcaResponse> obtenerTodos() {

        return marcaRepository.findAll()
                .stream()
                .map(marcaMapper::toResponse)
                .toList();
    }

    @Override
    public MarcaResponse actualizar(
            UUID id,
            MarcaRequest request
    ) {

        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Marca no encontrada con id: " + id
                        )
                );

        Boolean activoActual = marca.getActivo();

        marcaMapper.updateEntity(request, marca);

        if (request.activo() == null) {
            marca.setActivo(activoActual);
        }

        Marca actualizada = marcaRepository.save(marca);

        return marcaMapper.toResponse(actualizada);
    }

    @Override
    public MarcaResponse toggleActivo(UUID id) {

        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Marca no encontrada con id: " + id
                        )
                );

        marca.setActivo(!Boolean.TRUE.equals(marca.getActivo()));

        return marcaMapper.toResponse(marcaRepository.save(marca));
    }

    @Override
    @Transactional
    public void eliminar(UUID id) {

        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Marca no encontrada con id: " + id
                        )
                );

        marcaRepository.delete(marca);
    }
}
