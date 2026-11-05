package com.servillantas.servicios.repository;

import com.servillantas.servicios.domain.MaterialServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialServicioRepository extends JpaRepository<MaterialServicio, UUID> {

    Optional<MaterialServicio> findByIdempotencyKey(String idempotencyKey);

    boolean existsByServicioIdAndProductoId(UUID servicioId, UUID productoId);

    List<MaterialServicio> findByServicioId(UUID servicioId);
}
