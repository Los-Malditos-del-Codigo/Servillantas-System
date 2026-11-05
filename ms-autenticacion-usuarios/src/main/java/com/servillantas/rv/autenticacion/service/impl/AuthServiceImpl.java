package com.servillantas.rv.autenticacion.service.impl;

import java.time.OffsetDateTime;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.servillantas.rv.autenticacion.dto.auth.LoginRequest;
import com.servillantas.rv.autenticacion.dto.auth.LoginResponse;
import com.servillantas.rv.autenticacion.dto.auth.RegistroRequest;
import com.servillantas.rv.autenticacion.dto.perfil.PerfilResponse;
import com.servillantas.rv.autenticacion.entity.Perfil;
import com.servillantas.rv.autenticacion.entity.Rol;
import com.servillantas.rv.autenticacion.exception.BadRequestException;
import com.servillantas.rv.autenticacion.exception.ResourceNotFoundException;
import com.servillantas.rv.autenticacion.repository.PerfilRepository;
import com.servillantas.rv.autenticacion.repository.RolRepository;
import com.servillantas.rv.autenticacion.service.AuthService;
import com.servillantas.rv.autenticacion.service.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final PerfilRepository perfilRepository;

	private final PasswordEncoder passwordEncoder;

	private final RolRepository rolRepository;

	private final JwtService jwtService;

	@Override
	@Transactional
	public PerfilResponse registrar(RegistroRequest request) {

		String email = request.email().trim().toLowerCase();

		// 1. Verificar que el correo no esté registrado
		if (perfilRepository.existsByEmail(email)) {
			throw new BadRequestException("Ya existe un perfil registrado con ese correo");
		}

		// 2. Buscar el rol
		Rol rol = rolRepository.findById(request.rolId())
				.orElseThrow(() -> new ResourceNotFoundException("No se encontró el rol solicitado"));

		// 3. Crear el perfil
		Perfil perfil = new Perfil();

		perfil.setNombres(request.nombres().trim());

		perfil.setApellidos(request.apellidos() != null ? request.apellidos().trim() : null);

		perfil.setTelefono(request.telefono() != null ? request.telefono().trim() : null);

		perfil.setRol(rol);

		// Todo perfil nuevo empieza activo
		perfil.setActivo(true);

		perfil.setEmail(email);

		// 4. Encriptar contraseña con BCrypt
		perfil.setPasswordHash(passwordEncoder.encode(request.password()));

		// 5. Fechas
		OffsetDateTime ahora = OffsetDateTime.now();

		perfil.setCreatedAt(ahora);
		perfil.setUpdatedAt(ahora);

		// 6. Guardar
		Perfil perfilGuardado = perfilRepository.save(perfil);

		// 7. Convertir entidad a response
		return convertirAResponse(perfilGuardado);
	}

	@Override
	@Transactional(readOnly = true)
	public LoginResponse login(LoginRequest request) {

		Perfil perfil = perfilRepository.findByEmail(request.email())
				.orElseThrow(() -> new BadCredentialsException("Correo o contraseña incorrectos"));

		if (!Boolean.TRUE.equals(perfil.getActivo())) {

			throw new BadCredentialsException("El perfil se encuentra inactivo");
		}

		boolean passwordCorrecta = passwordEncoder.matches(request.password(), perfil.getPasswordHash());

		if (!passwordCorrecta) {

			throw new BadCredentialsException("Correo o contraseña incorrectos");
		}

		String token = jwtService.generateToken(perfil);

		return new LoginResponse(token, "Bearer", convertirAResponse(perfil), perfil.getRol());
	}

	private PerfilResponse convertirAResponse(Perfil perfil) {

		return new PerfilResponse(perfil.getId(), perfil.getNombres(), perfil.getApellidos(), perfil.getTelefono(),
				perfil.getRol().getId(), perfil.getRol().getNombre(), perfil.getActivo(), perfil.getEmail(),
				perfil.getCreatedAt(), perfil.getUpdatedAt());
	}

}