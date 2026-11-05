package com.servillantas.rv.autenticacion.dto.perfil;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PerfilRequest(

		@NotBlank(message = "Los nombres son obligatorios") String nombres,

		String apellidos,

		String telefono,

		@NotNull(message = "El rol es obligatorio") UUID rolId,

		@NotNull(message = "El estado activo es obligatorio") Boolean activo,

		@NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato válido") String email,

		@NotBlank(message = "La contraseña es obligatoria") String password

) {
}