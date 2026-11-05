package com.servillantas.inventario.mapper;

import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioRequest;
import com.servillantas.inventario.dto.ajusteinventario.AjusteInventarioResponse;
import com.servillantas.inventario.entity.AjusteInventario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AjusteInventarioMapper {

    AjusteInventarioResponse toResponse(AjusteInventario ajusteInventario);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    AjusteInventario toEntity(AjusteInventarioRequest request);

}
