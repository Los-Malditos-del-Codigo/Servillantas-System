package com.servillantas.producto.repository;

import com.servillantas.producto.entity.UnidadMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UnidadMedidaRepository extends JpaRepository<UnidadMedida, UUID> {
}