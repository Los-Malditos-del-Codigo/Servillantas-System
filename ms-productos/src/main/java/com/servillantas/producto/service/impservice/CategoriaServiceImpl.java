package com.servillantas.producto.service.impservice;

import com.servillantas.producto.dto.categoria.CategoriaRequest;
import com.servillantas.producto.dto.categoria.CategoriaResponse;
import com.servillantas.producto.entity.Categoria;
import com.servillantas.producto.exception.ResourceNotFoundException;
import com.servillantas.producto.mapper.CategoriaMapper;
import com.servillantas.producto.repository.CategoriaRepository;
import com.servillantas.producto.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final CategoriaMapper categoriaMapper;

    @Override
    public CategoriaResponse crear(CategoriaRequest request) {
        Categoria categoria = categoriaMapper.toEntity(request);

        if (categoria.getActivo() == null) {
            categoria.setActivo(true);
        }

        Categoria categoriaGuardada = categoriaRepository.save(categoria);

        return categoriaMapper.toResponse(categoriaGuardada);
    }

    @Override
    public CategoriaResponse obtenerPorId(UUID id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: " + id
                        )
                );

        return categoriaMapper.toResponse(categoria);
    }

    @Override
    public List<CategoriaResponse> obtenerTodos() {
        return categoriaRepository.findAll()
                .stream()
                .map(categoriaMapper::toResponse)
                .toList();
    }

    @Override
    public CategoriaResponse actualizar(UUID id, CategoriaRequest request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: " + id
                        )
                );

        Boolean activoActual = categoria.getActivo();

        categoriaMapper.updateEntity(request, categoria);

        if (request.activo() == null) {
            categoria.setActivo(activoActual);
        }

        Categoria categoriaActualizada = categoriaRepository.save(categoria);

        return categoriaMapper.toResponse(categoriaActualizada);
    }

    @Override
    public CategoriaResponse toggleActivo(UUID id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: " + id
                        )
                );

        categoria.setActivo(!Boolean.TRUE.equals(categoria.getActivo()));

        return categoriaMapper.toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public void eliminar(UUID id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: " + id
                        )
                );

        categoriaRepository.delete(categoria);
    }
}