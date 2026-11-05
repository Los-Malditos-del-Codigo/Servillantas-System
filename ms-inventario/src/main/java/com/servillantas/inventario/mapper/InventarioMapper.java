package com.servillantas.inventario.mapper;

import com.servillantas.inventario.dto.inventario.InventarioRequest;
import com.servillantas.inventario.dto.inventario.InventarioResponse;
import com.servillantas.inventario.entity.Inventario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventarioMapper {

    InventarioResponse toResponse(Inventario inventario);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    Inventario toEntity(InventarioRequest request);

}
