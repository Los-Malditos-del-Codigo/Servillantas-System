package com.servillantas.rv.autenticacion.exception;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException exception) {

		return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage());
	}

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException exception) {

		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage());
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException exception) {

		return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {

		Map<String, String> errores = new HashMap<>();

		exception.getBindingResult().getFieldErrors()
				.forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));

		Map<String, Object> body = new HashMap<>();

		body.put("timestamp", OffsetDateTime.now());

		body.put("status", HttpStatus.BAD_REQUEST.value());

		body.put("error", "Validation Error");

		body.put("message", "Existen errores de validación");

		body.put("errors", errores);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleGeneral(Exception exception) {

		return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno en el servidor");
	}

	private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {

		Map<String, Object> body = new HashMap<>();

		body.put("timestamp", OffsetDateTime.now());

		body.put("status", status.value());

		body.put("error", status.getReasonPhrase());

		body.put("message", message);

		return ResponseEntity.status(status).body(body);
	}
}