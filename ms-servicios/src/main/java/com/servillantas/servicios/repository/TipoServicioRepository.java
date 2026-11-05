package com.servillantas.servicios.repository;

import com.servillantas.servicios.domain.TipoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TipoServicioRepository extends JpaRepository<TipoServicio, UUID> {

    List<TipoServicio> findByActivoTrue();

    List<TipoServicio> findByActivo(boolean activo);

    boolean existsByNombreIgnoreCase(String nombre);
}
