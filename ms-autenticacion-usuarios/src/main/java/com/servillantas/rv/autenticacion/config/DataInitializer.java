package com.servillantas.rv.autenticacion.config;

import java.time.OffsetDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.servillantas.rv.autenticacion.entity.Perfil;
import com.servillantas.rv.autenticacion.entity.Rol;
import com.servillantas.rv.autenticacion.repository.PerfilRepository;
import com.servillantas.rv.autenticacion.repository.RolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

	private static final String ROL_PROPIETARIO = "PROPIETARIO";
	private static final String ROL_PERSONAL = "PERSONAL";

	private final RolRepository rolRepository;
	private final PerfilRepository perfilRepository;
	private final PasswordEncoder passwordEncoder;

	@Bean
	CommandLineRunner initAuthData() {
		return args -> {
			Rol propietario = ensureRol(
					ROL_PROPIETARIO,
					"Administrador del negocio con permisos de gestion y auditoria.");
			Rol personal = ensureRol(
					ROL_PERSONAL,
					"Personal de atencion con permisos operativos.");

			ensurePerfil("admin@servillantas.pe", "admin123",
					"Roberto", "Vargas Morales", "987654321", propietario);
			ensurePerfil("operador@servillantas.pe", "operador123",
					"Carlos", "Perez Huaman", "912345678", personal);

			log.info("Datos de autenticacion inicializados (roles y usuarios demo).");
		};
	}

	private Rol ensureRol(String nombre, String descripcion) {
		return rolRepository.findByNombre(nombre).orElseGet(() -> {
			OffsetDateTime ahora = OffsetDateTime.now();
			Rol rol = new Rol();
			rol.setNombre(nombre);
			rol.setDescripcion(descripcion);
			rol.setActivo(true);
			rol.setCreatedAt(ahora);
			rol.setUpdatedAt(ahora);
			Rol guardado = rolRepository.save(rol);
			log.info("Rol creado: {}", nombre);
			return guardado;
		});
	}

	private void ensurePerfil(String email, String password, String nombres, String apellidos,
			String telefono, Rol rol) {
		String correo = email.trim().toLowerCase();
		if (perfilRepository.existsByEmail(correo)) {
			return;
		}

		OffsetDateTime ahora = OffsetDateTime.now();
		Perfil perfil = new Perfil();
		perfil.setNombres(nombres);
		perfil.setApellidos(apellidos);
		perfil.setTelefono(telefono);
		perfil.setRol(rol);
		perfil.setActivo(true);
		perfil.setEmail(correo);
		perfil.setPasswordHash(passwordEncoder.encode(password));
		perfil.setRequiereCambioPassword(false);
		perfil.setCreatedAt(ahora);
		perfil.setUpdatedAt(ahora);
		perfilRepository.save(perfil);
		log.info("Usuario demo creado: {}", correo);
	}
}
