package com.servillantas.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CrearVentaRequestDto(
    String observacion,

    @NotEmpty(message = "La lista de items no puede estar vacía")
    @Valid
    List<CrearVentaItemDto> items
) {}
