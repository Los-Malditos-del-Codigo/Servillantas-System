package com.servillantas.rv.autenticacion.service.impl;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.servillantas.rv.autenticacion.dto.perfil.PerfilRequest;
import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;
import com.servillantas.rv.autenticacion.entity.Perfil;
import com.servillantas.rv.autenticacion.entity.Rol;
import com.servillantas.rv.autenticacion.exception.BadRequestException;
import com.servillantas.rv.autenticacion.exception.ResourceNotFoundException;
import com.servillantas.rv.autenticacion.repository.PerfilRepository;
import com.servillantas.rv.autenticacion.repository.RolRepository;
import com.servillantas.rv.autenticacion.service.PerfilService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PerfilServiceImpl implements PerfilService {

	private final PerfilRepository perfilRepository;

	private final RolRepository rolRepository;

	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public PerfilResponse crear(PerfilRequest request) {

		if (perfilRepository.existsByEmail(request.email())) {

			throw new BadRequestException("Ya existe un perfil registrado con ese correo");
		}

		Rol rol = rolRepository.findById(request.rolId())
				.orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol solicitado"));

		OffsetDateTime ahora = OffsetDateTime.now();

		Perfil perfil = new Perfil();

		perfil.setNombres(request.nombres());

		perfil.setApellidos(request.apellidos());

		perfil.setTelefono(request.telefono());

		perfil.setRol(rol);

		perfil.setActivo(request.activo());

		perfil.setEmail(request.email());

		perfil.setPasswordHash(passwordEncoder.encode(request.password()));

		perfil.setCreatedAt(ahora);

		perfil.setUpdatedAt(ahora);

		Perfil perfilGuardado = perfilRepository.save(perfil);

		return mapearResponse(perfilGuardado);
	}

	@Override
	@Transactional(readOnly = true)
	public PerfilResponse obtenerPorId(UUID id) {

		Perfil perfil = perfilRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("No se encontró el perfil solicitado"));

		return mapearResponse(perfil);
	}

	private PerfilResponse mapearResponse(Perfil perfil) {

		return new PerfilResponse(perfil.getId(), perfil.getNombres(), perfil.getApellidos(), perfil.getTelefono(),
				perfil.getRol().getId(), perfil.getRol().getNombre(), perfil.getActivo(), perfil.getEmail(),
				perfil.getCreatedAt(), perfil.getUpdatedAt());
	}
}