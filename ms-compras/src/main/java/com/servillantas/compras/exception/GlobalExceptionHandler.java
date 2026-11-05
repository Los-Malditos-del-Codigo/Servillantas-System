package com.servillantas.compras.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
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
        return problem;
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ProblemDetail handleMissingRequestHeader(MissingRequestHeaderException ex) {
        log.warn("Cabecera requerida ausente: {}", ex.getMessage());
        String msg = "La cabecera requerida '" + ex.getHeaderName() + "' no fue proporcionada.";
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, msg);
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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos: {}", ex.getMessage());
        String detail = "Conflicto de integridad en la base de datos.";
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null) {
            if (message.contains("uq_proveedores_ruc") || message.contains("proveedores_ruc_key")) {
                detail = "Ya existe un proveedor registrado con el RUC indicado.";
            } else if (message.contains("ck_proveedores_ruc")) {
                detail = "El formato del RUC no es válido (debe tener 11 dígitos numéricos).";
            } else if (message.contains("ck_compras_estado")) {
                detail = "El estado de la compra no es válido.";
            } else if (message.contains("HU-46")) {
                detail = "HU-46: recepcion_idempotency_key es obligatoria para confirmar recepcion.";
            } else if (message.contains("Transicion de compra no permitida")) {
                detail = message;
            }
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
        problem.setTitle("DUPLICADO_O_CONFLICTO");
        problem.setType(URI.create("urn:servillantas:error:conflicto_integridad"));
        problem.setProperty("code", "CONFLICTO_INTEGRIDAD");
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

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ProblemDetail handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("RECURSO_NO_ENCONTRADO");
        problem.setProperty("code", "RECURSO_NO_ENCONTRADO");
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
