package com.servillantas.rv.autenticacion.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.servillantas.rv.autenticacion.entity.Rol;

public interface RolRepository extends JpaRepository<Rol, UUID> {

	Optional<Rol> findByNombre(String nombre);
}
