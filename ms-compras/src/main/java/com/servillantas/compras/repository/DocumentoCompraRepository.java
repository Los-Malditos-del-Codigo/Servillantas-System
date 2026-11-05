package com.servillantas.compras.repository;

import com.servillantas.compras.domain.DocumentoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentoCompraRepository extends JpaRepository<DocumentoCompra, UUID> {

    List<DocumentoCompra> findByCompraId(UUID compraId);
}
