package com.servillantas.inventario.repository;

import com.servillantas.inventario.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, UUID> {

    Optional<Inventario> findByProductoId(UUID productoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventario i where i.productoId = :productoId")
    Optional<Inventario> findByProductoIdForUpdate(@Param("productoId") UUID productoId);

    boolean existsByProductoId(UUID productoId);
}
