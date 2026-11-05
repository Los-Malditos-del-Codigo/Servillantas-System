package com.servillantas.alertas.service;

import com.servillantas.alertas.domain.Notificacion;
import com.servillantas.alertas.dto.NotificacionDto;
import com.servillantas.alertas.dto.PageResponseDto;
import com.servillantas.alertas.exception.AccesoDenegadoException;
import com.servillantas.alertas.exception.RecursoNoEncontradoException;
import com.servillantas.alertas.repository.NotificacionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class NotificacionesService {

    private final NotificacionRepository notificacionRepository;

    public NotificacionesService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<NotificacionDto> listarNotificaciones(UUID usuarioId, Boolean leida, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), sort);

        Page<Notificacion> pageResult;
        if (leida == null) {
            pageResult = notificacionRepository.findByUsuarioId(usuarioId, pageable);
        } else {
            pageResult = notificacionRepository.findByUsuarioIdAndLeida(usuarioId, leida, pageable);
        }

        List<NotificacionDto> content = pageResult.getContent().stream().map(this::mapToDto).toList();
        return new PageResponseDto<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Transactional
    public NotificacionDto marcarComoLeida(UUID id, UUID usuarioId) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Notificación no encontrada con id: " + id));

        if (!notificacion.getUsuarioId().equals(usuarioId)) {
            throw new AccesoDenegadoException("La notificación pertenece a otro usuario");
        }

        notificacion.setLeida(true);
        notificacion.setReadAt(OffsetDateTime.now());

        Notificacion guardada = notificacionRepository.save(notificacion);
        return mapToDto(guardada);
    }

    private NotificacionDto mapToDto(Notificacion n) {
        return new NotificacionDto(
                n.getId(),
                n.getAlertaId(),
                n.getUsuarioId(),
                n.getMensaje(),
                n.isLeida(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}

