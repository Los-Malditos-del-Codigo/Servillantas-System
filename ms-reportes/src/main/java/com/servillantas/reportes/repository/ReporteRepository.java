package com.servillantas.reportes.repository;
import com.servillantas.reportes.domain.Reporte;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ReporteRepository extends JpaRepository<Reporte,UUID>{
    Page<Reporte> findByUsuarioId(UUID usuarioId,Pageable pageable);
    Page<Reporte> findByTipoIgnoreCase(String tipo,Pageable pageable);
    Page<Reporte> findByUsuarioIdAndTipoIgnoreCase(UUID usuarioId,String tipo,Pageable pageable);
}
