package com.servillantas.compras.repository;

import com.servillantas.compras.domain.Compra;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompraRepository extends JpaRepository<Compra, UUID> {

    Optional<Compra> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Compra c WHERE c.id = :id")
    Optional<Compra> findByIdWithLock(@Param("id") UUID id);

    @Query("SELECT c FROM Compra c LEFT JOIN FETCH c.proveedor LEFT JOIN FETCH c.items WHERE c.id = :id")
    Optional<Compra> findByIdWithDetalle(@Param("id") UUID id);

    @Query("""
        SELECT c FROM Compra c
        WHERE (:proveedorId IS NULL OR c.proveedor.id = :proveedorId)
          AND (:estado IS NULL OR c.estado = :estado)
          AND (CAST(:fechaInicio AS timestamp) IS NULL OR c.fecha >= :fechaInicio)
          AND (CAST(:fechaFin AS timestamp) IS NULL OR c.fecha <= :fechaFin)
    """)
    Page<Compra> findByFiltros(
        @Param("proveedorId") UUID proveedorId,
        @Param("estado") String estado,
        @Param("fechaInicio") OffsetDateTime fechaInicio,
        @Param("fechaFin") OffsetDateTime fechaFin,
        Pageable pageable
    );
}
