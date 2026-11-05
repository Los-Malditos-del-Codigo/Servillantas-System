package com.servillantas.rv.autenticacion.dto.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RegistroResponse(

        UUID id,

        String nombres,

        String apellidos,

        String telefono,

        String email,

        UUID rolId,

        String rol,

        Boolean activo,

        OffsetDateTime createdAt

) {
}