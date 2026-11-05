package com.servillantas.alertas.exception;

import org.springframework.http.HttpStatus;

public class RecursoDuplicadoException extends BaseApiException {

    public RecursoDuplicadoException(String message) {
        super(message, "CONFLICTO", HttpStatus.CONFLICT);
    }
}

