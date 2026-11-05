package com.servillantas.asistente.repository;
import com.servillantas.asistente.domain.Conversacion;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ConversacionRepository extends JpaRepository<Conversacion,UUID>{Page<Conversacion> findByUsuarioId(UUID usuarioId,Pageable pageable);}
