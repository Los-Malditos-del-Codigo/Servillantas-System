package com.servillantas.ventas.repository;

import com.servillantas.ventas.domain.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, UUID> {

    List<DetalleVenta> findByVentaId(UUID ventaId);
}
