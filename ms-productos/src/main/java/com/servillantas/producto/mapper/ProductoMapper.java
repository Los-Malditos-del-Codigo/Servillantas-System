package com.servillantas.producto.mapper;

import com.servillantas.producto.dto.producto.ProductoRequest;
import com.servillantas.producto.dto.producto.ProductoResponse;
import com.servillantas.producto.entity.Producto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductoMapper {

    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "marca", ignore = true)
    @Mapping(target = "unidadMedida", ignore = true)
    Producto toEntity(ProductoRequest request);

    @Mapping(target = "categoriaId", source = "categoria.id")
    @Mapping(target = "categoriaNombre", source = "categoria.nombre")
    @Mapping(target = "marcaId", source = "marca.id")
    @Mapping(target = "marcaNombre", source = "marca.nombre")
    @Mapping(target = "unidadMedidaId", source = "unidadMedida.id")
    @Mapping(target = "unidadMedidaNombre", source = "unidadMedida.nombre")
    @Mapping(target = "unidadMedidaAbreviatura", source = "unidadMedida.abreviatura")
    @Mapping(target = "createdAt", source = "fechaCreacion")
    @Mapping(target = "updatedAt", source = "fechaActualizacion")
    ProductoResponse toResponse(Producto producto);

    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "marca", ignore = true)
    @Mapping(target = "unidadMedida", ignore = true)

    void updateEntity(
            ProductoRequest request,
            @MappingTarget Producto producto
    );
}