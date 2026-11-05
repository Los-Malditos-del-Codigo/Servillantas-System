package com.servillantas.reportes.exception;

import org.springframework.http.HttpStatus;

public abstract class BaseApiException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public BaseApiException(String message, String code, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

