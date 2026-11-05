package com.servillantas.reportes.service;

import com.servillantas.reportes.domain.Reporte;
import com.servillantas.reportes.dto.CrearReporteRequestDto;
import com.servillantas.reportes.dto.PageResponseDto;
import com.servillantas.reportes.dto.ReporteDto;
import com.servillantas.reportes.exception.AccesoDenegadoException;
import com.servillantas.reportes.exception.RecursoNoEncontradoException;
import com.servillantas.reportes.exception.ValidacionException;
import com.servillantas.reportes.repository.ReporteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReportesService {

    private final ReporteRepository reporteRepository;

    public ReportesService(ReporteRepository reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    @Transactional
    public ReporteDto crearReporte(UUID usuarioId, CrearReporteRequestDto request) {
        if (request.parametros() != null && request.parametros().size() > 50) {
            throw new ValidacionException("Demasiados parámetros (máximo 50)");
        }

        String archivoUrlNormalizada = normalizarUrl(request.archivoUrl());
        Reporte reporte = new Reporte(
                usuarioId,
                request.tipo().trim().toUpperCase(),
                request.formato().trim().toUpperCase(),
                request.parametros(),
                archivoUrlNormalizada
        );

        Reporte guardado = reporteRepository.save(reporte);
        return mapToDto(guardado);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ReporteDto> listarReportes(UUID usuarioId, String tipo, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), sort);

        Page<Reporte> pageResult;
        if (tipo != null && !tipo.isBlank()) {
            pageResult = reporteRepository.findByUsuarioIdAndTipoIgnoreCase(usuarioId, tipo.trim(), pageable);
        } else {
            pageResult = reporteRepository.findByUsuarioId(usuarioId, pageable);
        }

        List<ReporteDto> content = pageResult.getContent().stream().map(this::mapToDto).toList();
        return new PageResponseDto<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public ReporteDto obtenerReportePorId(UUID id, UUID usuarioId) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reporte no encontrado con id: " + id));

        if (reporte.getUsuarioId() != null && !reporte.getUsuarioId().equals(usuarioId)) {
            throw new AccesoDenegadoException("El reporte pertenece a otro usuario");
        }

        return mapToDto(reporte);
    }

    private String normalizarUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String limpia = url.trim();
        if (!(limpia.startsWith("https://") || limpia.startsWith("s3://"))) {
            throw new ValidacionException("archivo_url debe usar protocolo https:// o s3://");
        }
        return limpia;
    }

    private ReporteDto mapToDto(Reporte r) {
        return new ReporteDto(
                r.getId(),
                r.getUsuarioId(),
                r.getTipo(),
                r.getFormato(),
                r.getParametros(),
                r.getArchivoUrl(),
                r.getCreatedAt()
        );
    }
}

