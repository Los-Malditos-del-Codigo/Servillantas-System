package com.servillantas.rv.autenticacion.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;
import com.servillantas.rv.autenticacion.service.PerfilService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/perfiles")
@RequiredArgsConstructor
public class PerfilController {

	private final PerfilService perfilService;

	@GetMapping("/{id}")
	public ResponseEntity<PerfilResponse> obtenerPorId(@PathVariable UUID id) {

		return ResponseEntity.ok(perfilService.obtenerPorId(id));
	}
}
