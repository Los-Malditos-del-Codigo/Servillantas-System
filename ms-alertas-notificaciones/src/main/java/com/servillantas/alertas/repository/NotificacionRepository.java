package com.servillantas.alertas.repository;
import com.servillantas.alertas.domain.Notificacion;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface NotificacionRepository extends JpaRepository<Notificacion, UUID> {
    boolean existsByAlertaIdAndUsuarioId(UUID alertaId,UUID usuarioId);
    Page<Notificacion> findByUsuarioId(UUID usuarioId, Pageable pageable);
    Page<Notificacion> findByUsuarioIdAndLeida(UUID usuarioId, boolean leida, Pageable pageable);
}
