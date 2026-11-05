package com.servillantas.rv.autenticacion.dto.perfil;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PerfilResponse(

		UUID id,

		String nombres,

		String apellidos,

		String telefono,

		UUID rolId,

		String rol,

		Boolean activo,

		String email,

		OffsetDateTime createdAt,

		OffsetDateTime updatedAt

) {
}