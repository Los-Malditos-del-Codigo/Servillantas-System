package com.servillantas.producto.mapper;

import com.servillantas.producto.dto.unidadmedida.UnidadMedidaRequest;
import com.servillantas.producto.dto.unidadmedida.UnidadMedidaResponse;
import com.servillantas.producto.entity.UnidadMedida;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UnidadMedidaMapper {

    UnidadMedidaResponse toResponse(UnidadMedida unidadMedida);

    UnidadMedida toEntity(UnidadMedidaRequest request);

    void updateEntity(UnidadMedidaRequest request, @MappingTarget UnidadMedida unidadMedida);
}