package com.servillantas.alertas.exception;

import org.springframework.http.HttpStatus;

public class RecursoNoEncontradoException extends BaseApiException {

    public RecursoNoEncontradoException(String message) {
        super(message, "NO_ENCONTRADO", HttpStatus.NOT_FOUND);
    }
}

