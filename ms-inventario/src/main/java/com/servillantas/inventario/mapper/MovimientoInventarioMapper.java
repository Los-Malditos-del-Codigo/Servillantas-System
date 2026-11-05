package com.servillantas.inventario.mapper;

import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioRequest;
import com.servillantas.inventario.dto.movimientoinventario.MovimientoInventarioResponse;
import com.servillantas.inventario.entity.MovimientoInventario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MovimientoInventarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "stockAnterior", ignore = true)
    @Mapping(target = "stockResultante", ignore = true)
    @Mapping(target = "fechaCreacion", ignore = true)
    MovimientoInventario toEntity(MovimientoInventarioRequest request);

    MovimientoInventarioResponse toResponse(MovimientoInventario movimientoInventario);
}
