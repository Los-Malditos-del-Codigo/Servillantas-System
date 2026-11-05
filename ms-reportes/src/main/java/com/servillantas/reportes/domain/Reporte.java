package com.servillantas.reportes.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "reportes")
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "tipo", nullable = false, length = 60)
    private String tipo;

    @Column(name = "formato", nullable = false, length = 10)
    private String formato;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parametros", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> parametros = new LinkedHashMap<>();

    @Column(name = "archivo_url", columnDefinition = "text")
    private String archivoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Reporte() {
    }

    public Reporte(UUID usuarioId, String tipo, String formato, Map<String, Object> parametros, String archivoUrl) {
        this.usuarioId = usuarioId;
        this.tipo = tipo;
        this.formato = formato;
        this.parametros = parametros != null ? parametros : new LinkedHashMap<>();
        this.archivoUrl = archivoUrl;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    // Getters y Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(UUID usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getFormato() {
        return formato;
    }

    public void setFormato(String formato) {
        this.formato = formato;
    }

    public Map<String, Object> getParametros() {
        return parametros;
    }

    public void setParametros(Map<String, Object> parametros) {
        this.parametros = parametros;
    }

    public String getArchivoUrl() {
        return archivoUrl;
    }

    public void setArchivoUrl(String archivoUrl) {
        this.archivoUrl = archivoUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
