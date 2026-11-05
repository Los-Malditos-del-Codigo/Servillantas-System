package com.servillantas.servicios.repository;

import com.servillantas.servicios.domain.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, UUID>, JpaSpecificationExecutor<Servicio> {

    Optional<Servicio> findByIdempotencyKey(String idempotencyKey);
}
