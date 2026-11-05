package com.servillantas.compras.exception;

import org.springframework.http.HttpStatus;

public class DuplicadoException extends BaseApiException {

    public DuplicadoException(String message) {
        super(message, "DUPLICADO", HttpStatus.CONFLICT);
    }
}
