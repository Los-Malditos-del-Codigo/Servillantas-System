package com.servillantas.servicios.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BaseApiException.class)
    public ProblemDetail handleBaseApiException(BaseApiException ex) {
        log.warn("Excepción de negocio [{}]: {}", ex.getCode(), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problem.setTitle(ex.getCode());
        problem.setType(URI.create("urn:servillantas:error:" + ex.getCode().toLowerCase()));
        problem.setProperty("code", ex.getCode());

        if (ex instanceof StockInsuficienteException stockEx) {
            problem.setProperty("productoId", stockEx.getProductoId());
            if (stockEx.getStockDisponible() != null) {
                problem.setProperty("stockDisponible", stockEx.getStockDisponible());
            }
        }
        return problem;
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ProblemDetail handleMissingRequestHeader(MissingRequestHeaderException ex) {
        log.warn("Cabecera requerida ausente: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "La cabecera requerida '" + ex.getHeaderName() + "' no fue proporcionada.");
        problem.setTitle("VALIDACION");
        problem.setType(URI.create("urn:servillantas:error:validacion"));
        problem.setProperty("code", "VALIDACION");
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        log.warn("Error de validación de entrada: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Los datos enviados contienen errores de validación.");
        problem.setTitle("VALIDACION");
        problem.setType(URI.create("urn:servillantas:error:validacion"));
        problem.setProperty("code", "VALIDACION");
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Parámetro inválido: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("VALIDACION");
        problem.setType(URI.create("urn:servillantas:error:validacion"));
        problem.setProperty("code", "VALIDACION");
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Error no controlado en el servidor", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Ha ocurrido un error interno en el servidor.");
        problem.setTitle("ERROR_INTERNO");
        problem.setType(URI.create("urn:servillantas:error:error_interno"));
        problem.setProperty("code", "ERROR_INTERNO");
        return problem;
    }
}
