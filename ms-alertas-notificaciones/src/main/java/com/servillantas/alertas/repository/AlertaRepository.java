package com.servillantas.alertas.repository;
import com.servillantas.alertas.domain.Alerta;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AlertaRepository extends JpaRepository<Alerta, UUID> {
    Page<Alerta> findByEstado(String estado, Pageable pageable);
    Optional<Alerta> findByProductoIdAndEstado(UUID productoId, String estado);
}
