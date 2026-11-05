package com.servillantas.reportes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record CrearReporteRequestDto(
    @NotBlank(message = "El tipo de reporte es obligatorio")
    @Size(max = 60, message = "El tipo no debe exceder 60 caracteres")
    String tipo,

    @NotBlank(message = "El formato es obligatorio")
    @Pattern(regexp = "(?i)PDF|XLSX", message = "El formato debe ser PDF o XLSX")
    String formato,

    Map<String, Object> parametros,

    String archivoUrl
) {}

