package com.servillantas.ventas.exception;

import org.springframework.http.HttpStatus;

public class IdempotencyConflictException extends BaseApiException {

    public IdempotencyConflictException(String message) {
        super(message, "IDEMPOTENCY_KEY_CONFLICT", HttpStatus.CONFLICT);
    }
}
