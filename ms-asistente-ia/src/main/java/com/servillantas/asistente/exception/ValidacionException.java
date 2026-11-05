package com.servillantas.asistente.exception;

import org.springframework.http.HttpStatus;

public class ValidacionException extends BaseApiException {

    public ValidacionException(String message) {
        super(message, "VALIDACION", HttpStatus.BAD_REQUEST);
    }
}

