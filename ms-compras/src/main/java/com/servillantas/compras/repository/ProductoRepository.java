package com.servillantas.compras.repository;

import com.servillantas.compras.domain.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, UUID> {

    boolean existsByIdAndActivoTrue(UUID id);

    Optional<Producto> findByIdAndActivoTrue(UUID id);
}
