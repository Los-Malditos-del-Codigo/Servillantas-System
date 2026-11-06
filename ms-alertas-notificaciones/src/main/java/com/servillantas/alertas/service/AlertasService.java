package com.servillantas.alertas.service;

import com.servillantas.alertas.domain.Alerta;
import com.servillantas.alertas.domain.Notificacion;
import com.servillantas.alertas.dto.*;
import com.servillantas.alertas.exception.RecursoDuplicadoException;
import com.servillantas.alertas.exception.RecursoNoEncontradoException;
import com.servillantas.alertas.exception.ValidacionException;
import com.servillantas.alertas.repository.AlertaRepository;
import com.servillantas.alertas.repository.NotificacionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AlertasService {

    private final AlertaRepository alertaRepository;
    private final NotificacionRepository notificacionRepository;
    private final ReferenceValidator referenceValidator;

    public AlertasService(AlertaRepository alertaRepository,
                          NotificacionRepository notificacionRepository,
                          ReferenceValidator referenceValidator) {
        this.alertaRepository = alertaRepository;
        this.notificacionRepository = notificacionRepository;
        this.referenceValidator = referenceValidator;
    }

    @Transactional
    public AlertaDto crearAlerta(CrearAlertaRequestDto request) {
        referenceValidator.producto(request.productoId());

        Alerta alerta = alertaRepository.findByProductoIdAndEstado(request.productoId(), "ACTIVA")
                .orElseGet(() -> alertaRepository.save(new Alerta(request.productoId(), request.mensaje().trim())));

        return mapToDto(alerta);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<AlertaDto> listarAlertas(String estado, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), sort);

        Page<Alerta> pageResult;
        if (estado != null && !estado.isBlank()) {
            String estadoUpper = normalizarEstado(estado);
            pageResult = alertaRepository.findByEstado(estadoUpper, pageable);
        } else {
            pageResult = alertaRepository.findAll(pageable);
        }

        List<AlertaDto> content = pageResult.getContent().stream().map(this::mapToDto).toList();
        return new PageResponseDto<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Transactional
    public AlertaDto resolverAlerta(UUID id) {
        return actualizarEstado(id, "RESUELTA");
    }

    @Transactional
    public AlertaDto actualizarEstado(UUID id, String estadoRaw) {
        if (estadoRaw == null || estadoRaw.isBlank()) {
            throw new ValidacionException("El estado es obligatorio");
        }
        String nuevoEstado = normalizarEstado(estadoRaw);
        Alerta alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Alerta no encontrada con id: " + id));

        alerta.setEstado(nuevoEstado);
        if ("RESUELTA".equals(nuevoEstado)) {
            alerta.setResueltaAt(OffsetDateTime.now());
        } else {
            alerta.setResueltaAt(null);
        }
        alerta.setUpdatedAt(OffsetDateTime.now());

        Alerta guardada = alertaRepository.save(alerta);
        return mapToDto(guardada);
    }

    private String normalizarEstado(String raw) {
        String upper = raw.trim().toUpperCase();
        return switch (upper) {
            case "ACTIVA", "PENDIENTE" -> "ACTIVA";
            case "LEIDA", "LEÍDA" -> "LEIDA";
            case "RESUELTA" -> "RESUELTA";
            default -> throw new ValidacionException("Estado de alerta inválido. Valores permitidos: ACTIVA, LEIDA, RESUELTA");
        };
    }

    @Transactional
    public NotificacionDto notificar(UUID id, NotificarAlertaRequestDto request) {
        if (!alertaRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("Alerta no encontrada con id: " + id);
        }

        referenceValidator.usuario(request.usuarioId());

        if (notificacionRepository.existsByAlertaIdAndUsuarioId(id, request.usuarioId())) {
            throw new RecursoDuplicadoException("El usuario ya fue notificado para esta alerta");
        }

        Notificacion notificacion = new Notificacion(id, request.usuarioId(), request.mensaje().trim());
        Notificacion guardada = notificacionRepository.save(notificacion);

        return new NotificacionDto(
                guardada.getId(),
                guardada.getAlertaId(),
                guardada.getUsuarioId(),
                guardada.getMensaje(),
                guardada.isLeida(),
                guardada.getReadAt(),
                guardada.getCreatedAt()
        );
    }

    private AlertaDto mapToDto(Alerta a) {
        return new AlertaDto(
                a.getId(),
                a.getProductoId(),
                a.getTipo(),
                a.getEstado(),
                a.getMensaje(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                a.getResueltaAt()
        );
    }
}

