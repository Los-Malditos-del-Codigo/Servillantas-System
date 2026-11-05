package com.servillantas.producto.mapper;

import com.servillantas.producto.dto.marca.MarcaRequest;
import com.servillantas.producto.dto.marca.MarcaResponse;
import com.servillantas.producto.entity.Marca;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface MarcaMapper {

    MarcaResponse toResponse(Marca marca);

    Marca toEntity(MarcaRequest request);

    void updateEntity(MarcaRequest request, @MappingTarget Marca marca);
}
