package com.servillantas.ventas.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private VentaEstado estado;

    @Column(name = "fecha", nullable = false)
    private OffsetDateTime fecha;

    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "motivo_anulacion", length = 500)
    private String motivoAnulacion;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "confirmacion_idempotency_key", length = 100)
    private String confirmacionIdempotencyKey;

    @Column(name = "anulacion_idempotency_key", length = 100)
    private String anulacionIdempotencyKey;

    @Column(name = "correlation_id")
    private UUID correlationId;

    @Column(name = "confirmada_at")
    private OffsetDateTime confirmadaAt;

    @Column(name = "anulada_at")
    private OffsetDateTime anuladaAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleVenta> items = new ArrayList<>();

    public Venta() {
    }

    public Venta(UUID id, UUID usuarioId, String observacion, String idempotencyKey, UUID correlationId) {
        this.id = id != null ? id : UUID.randomUUID();
        this.usuarioId = usuarioId;
        this.estado = VentaEstado.REGISTRADA;
        this.fecha = OffsetDateTime.now();
        this.total = BigDecimal.ZERO;
        this.observacion = observacion;
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
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }
        if (this.total == null) {
            this.total = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void addItem(DetalleVenta item) {
        items.add(item);
        item.setVenta(this);
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

    public VentaEstado getEstado() {
        return estado;
    }

    public void setEstado(VentaEstado estado) {
        this.estado = estado;
    }

    public OffsetDateTime getFecha() {
        return fecha;
    }

    public void setFecha(OffsetDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
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

    public String getConfirmacionIdempotencyKey() {
        return confirmacionIdempotencyKey;
    }

    public void setConfirmacionIdempotencyKey(String confirmacionIdempotencyKey) {
        this.confirmacionIdempotencyKey = confirmacionIdempotencyKey;
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

    public OffsetDateTime getConfirmadaAt() {
        return confirmadaAt;
    }

    public void setConfirmadaAt(OffsetDateTime confirmadaAt) {
        this.confirmadaAt = confirmadaAt;
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

    public List<DetalleVenta> getItems() {
        return items;
    }

    public void setItems(List<DetalleVenta> items) {
        this.items = items;
    }
}
