package com.servillantas.ventas.repository;

import com.servillantas.ventas.domain.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VentaRepository extends JpaRepository<Venta, UUID>, JpaSpecificationExecutor<Venta> {

    Optional<Venta> findByIdempotencyKey(String idempotencyKey);
}
