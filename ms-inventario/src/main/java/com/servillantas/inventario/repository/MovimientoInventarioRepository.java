package com.servillantas.inventario.repository;

import com.servillantas.inventario.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovimientoInventarioRepository extends
        JpaRepository<MovimientoInventario, UUID>,
        JpaSpecificationExecutor<MovimientoInventario> {

    List<MovimientoInventario> findByProductoIdOrderByFechaCreacionDesc(UUID productoId);

    List<MovimientoInventario> findByProductoIdAndTipoOrderByFechaCreacionDesc(UUID productoId, String tipo);

    Optional<MovimientoInventario> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    boolean existsByProductoIdAndOrigen(UUID productoId, String origen);
}
