package com.servillantas.compras.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearProveedorRequestDto(
    @NotBlank(message = "El nombre del proveedor es obligatorio")
    @Size(max = 180, message = "El nombre no puede exceder 180 caracteres")
    String nombre,

    @Pattern(regexp = "^$|^[0-9]{11}$", message = "El RUC debe tener exactamente 11 dígitos numéricos")
    @Size(max = 11, message = "El RUC no puede exceder 11 caracteres")
    String ruc,

    @Size(max = 30, message = "El teléfono no puede exceder 30 caracteres")
    String telefono,

    @Email(message = "El formato del email es inválido")
    @Size(max = 254, message = "El email no puede exceder 254 caracteres")
    String email,

    @Size(max = 300, message = "La dirección no puede exceder 300 caracteres")
    String direccion
) {}
