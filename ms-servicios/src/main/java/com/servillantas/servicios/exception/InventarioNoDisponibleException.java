package com.servillantas.servicios.exception;

import org.springframework.http.HttpStatus;

public class InventarioNoDisponibleException extends BaseApiException {

    public InventarioNoDisponibleException(String message) {
        super(message, "INVENTARIO_NO_DISPONIBLE", HttpStatus.SERVICE_UNAVAILABLE);
    }
}
