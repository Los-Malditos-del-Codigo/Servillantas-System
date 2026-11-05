package com.servillantas.compras.repository;

import com.servillantas.compras.domain.DetalleCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, UUID> {

    List<DetalleCompra> findByCompraId(UUID compraId);
}
