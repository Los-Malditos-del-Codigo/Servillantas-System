package com.servillantas.compras.exception;

import org.springframework.http.HttpStatus;

public class EstadoInvalidoException extends BaseApiException {

    public EstadoInvalidoException(String message) {
        super(message, "ESTADO_INVALIDO", HttpStatus.CONFLICT);
    }
}
