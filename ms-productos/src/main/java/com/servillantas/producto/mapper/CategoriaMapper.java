package com.servillantas.producto.mapper;


import com.servillantas.producto.dto.categoria.CategoriaRequest;
import com.servillantas.producto.dto.categoria.CategoriaResponse;
import com.servillantas.producto.entity.Categoria;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoriaMapper {

    CategoriaResponse toResponse(Categoria categoria);

    Categoria toEntity(CategoriaRequest request);

    void updateEntity(CategoriaRequest request, @MappingTarget Categoria categoria);
}