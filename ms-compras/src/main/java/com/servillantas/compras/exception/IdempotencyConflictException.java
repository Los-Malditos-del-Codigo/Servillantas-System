package com.servillantas.compras.exception;

import org.springframework.http.HttpStatus;

public class IdempotencyConflictException extends BaseApiException {

    public IdempotencyConflictException(String message) {
        super(message, "IDEMPOTENCIA_CONFLICTO", HttpStatus.CONFLICT);
    }
}
