package com.servillantas.servicios.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "servicios")
public class Servicio {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_servicio_id", nullable = false)
    private TipoServicio tipoServicio;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "precio", nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "fecha", nullable = false)
    private OffsetDateTime fecha;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private ServicioEstado estado = ServicioEstado.REALIZADO;

    @Column(name = "motivo_anulacion", length = 500)
    private String motivoAnulacion;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "anulacion_idempotency_key", length = 100)
    private String anulacionIdempotencyKey;

    @Column(name = "correlation_id")
    private UUID correlationId;

    @Column(name = "anulada_at")
    private OffsetDateTime anuladaAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "servicio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MaterialServicio> materiales = new ArrayList<>();

    public Servicio() {
    }

    public Servicio(UUID id, TipoServicio tipoServicio, UUID usuarioId, BigDecimal precio, OffsetDateTime fecha, String observacion, String idempotencyKey, UUID correlationId) {
        this.id = id != null ? id : UUID.randomUUID();
        this.tipoServicio = tipoServicio;
        this.usuarioId = usuarioId;
        this.precio = precio;
        this.fecha = fecha != null ? fecha : OffsetDateTime.now();
        this.observacion = observacion;
        this.estado = ServicioEstado.REALIZADO;
        this.idempotencyKey = idempotencyKey;
        this.correlationId = correlationId;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.fecha == null) {
            this.fecha = OffsetDateTime.now();
        }
        if (this.estado == null) {
            this.estado = ServicioEstado.REALIZADO;
        }
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void addMaterial(MaterialServicio material) {
        materiales.add(material);
        material.setServicio(this);
    }

    // Getters y Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public TipoServicio getTipoServicio() {
        return tipoServicio;
    }

    public void setTipoServicio(TipoServicio tipoServicio) {
        this.tipoServicio = tipoServicio;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(UUID usuarioId) {
        this.usuarioId = usuarioId;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public OffsetDateTime getFecha() {
        return fecha;
    }

    public void setFecha(OffsetDateTime fecha) {
        this.fecha = fecha;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public ServicioEstado getEstado() {
        return estado;
    }

    public void setEstado(ServicioEstado estado) {
        this.estado = estado;
    }

    public String getMotivoAnulacion() {
        return motivoAnulacion;
    }

    public void setMotivoAnulacion(String motivoAnulacion) {
        this.motivoAnulacion = motivoAnulacion;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getAnulacionIdempotencyKey() {
        return anulacionIdempotencyKey;
    }

    public void setAnulacionIdempotencyKey(String anulacionIdempotencyKey) {
        this.anulacionIdempotencyKey = anulacionIdempotencyKey;
    }

    public UUID getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(UUID correlationId) {
        this.correlationId = correlationId;
    }

    public OffsetDateTime getAnuladaAt() {
        return anuladaAt;
    }

    public void setAnuladaAt(OffsetDateTime anuladaAt) {
        this.anuladaAt = anuladaAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<MaterialServicio> getMateriales() {
        return materiales;
    }

    public void setMateriales(List<MaterialServicio> materiales) {
        this.materiales = materiales;
    }
}
