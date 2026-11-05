package com.servillantas.rv.autenticacion.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servillantas.rv.autenticacion.dto.auth.LoginRequest;
import com.servillantas.rv.autenticacion.dto.auth.LoginResponse;
import com.servillantas.rv.autenticacion.dto.auth.RegistroRequest;
import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;
import com.servillantas.rv.autenticacion.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ResponseEntity<PerfilResponse> registrar(@Valid @RequestBody RegistroRequest request) {

		PerfilResponse response = authService.registrar(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {

		return ResponseEntity.ok(authService.login(request));
	}
}