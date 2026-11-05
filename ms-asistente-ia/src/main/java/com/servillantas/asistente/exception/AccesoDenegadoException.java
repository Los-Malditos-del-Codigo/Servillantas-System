package com.servillantas.asistente.exception;

import org.springframework.http.HttpStatus;

public class AccesoDenegadoException extends BaseApiException {

    public AccesoDenegadoException(String message) {
        super(message, "ACCESO_DENEGADO", HttpStatus.FORBIDDEN);
    }
}

