package com.servillantas.asistente.repository;
import com.servillantas.asistente.domain.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MensajeRepository extends JpaRepository<Mensaje,UUID>{List<Mensaje> findByConversacionIdOrderByCreatedAtAsc(UUID conversacionId);}
