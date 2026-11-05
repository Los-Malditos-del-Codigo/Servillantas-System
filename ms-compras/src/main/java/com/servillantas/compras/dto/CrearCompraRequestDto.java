package com.servillantas.compras.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CrearCompraRequestDto(
    @NotNull(message = "El proveedor_id es obligatorio")
    @JsonAlias({"proveedor_id", "proveedorId"})
    UUID proveedorId,

    String observacion,

    @NotEmpty(message = "La compra debe tener al menos un producto en items")
    @Valid
    List<CrearCompraItemDto> items
) {}
