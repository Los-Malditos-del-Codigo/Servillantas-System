package com.servillantas.rv.autenticacion.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servillantas.rv.autenticacion.entity.Perfil;

public interface PerfilRepository extends JpaRepository<Perfil, UUID> {
	Optional<Perfil> findByEmail(String email);

	Optional<Perfil> findByIdAndActivoTrue(UUID id);

	boolean existsByEmail(String email);
}
