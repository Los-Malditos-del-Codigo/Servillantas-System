package com.servillantas.rv.autenticacion.dto.auth;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistroRequest(

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100, message = "Los nombres no pueden superar los 100 caracteres")
        String nombres,

        @Size(max = 100, message = "Los apellidos no pueden superar los 100 caracteres")
        String apellidos,

        @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
        String telefono,

        @NotNull(message = "El rol es obligatorio")
        UUID rolId,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 150, message = "El correo no puede superar los 150 caracteres")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
        String password

) {
}