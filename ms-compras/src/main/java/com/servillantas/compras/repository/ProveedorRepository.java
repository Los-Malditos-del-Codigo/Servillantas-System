package com.servillantas.compras.repository;

import com.servillantas.compras.domain.Proveedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, UUID> {

    Optional<Proveedor> findByRuc(String ruc);

    boolean existsByRuc(String ruc);

    @Query("""
        SELECT p FROM Proveedor p
        WHERE (:activo IS NULL OR p.activo = :activo)
          AND (:busqueda IS NULL OR :busqueda = ''
               OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%'))
               OR (p.ruc IS NOT NULL AND p.ruc LIKE CONCAT('%', :busqueda, '%')))
    """)
    Page<Proveedor> findByFiltros(
        @Param("busqueda") String busqueda,
        @Param("activo") Boolean activo,
        Pageable pageable
    );
}
