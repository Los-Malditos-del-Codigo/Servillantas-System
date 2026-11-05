package com.servillantas.inventario.repository;

import com.servillantas.inventario.entity.AjusteInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface AjusteInventarioRepository extends JpaRepository<AjusteInventario, UUID> {

    List<AjusteInventario> findByProductoIdOrderByFechaCreacionDesc(UUID productoId);

    List<AjusteInventario> findByUsuarioIdOrderByFechaCreacionDesc(UUID usuarioId);

    Optional<AjusteInventario> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
