package com.servillantas.compras.exception;

import org.springframework.http.HttpStatus;

public class RecursoNoEncontradoException extends BaseApiException {

    public RecursoNoEncontradoException(String message) {
        super(message, "RECURSO_NO_ENCONTRADO", HttpStatus.NOT_FOUND);
    }
}
