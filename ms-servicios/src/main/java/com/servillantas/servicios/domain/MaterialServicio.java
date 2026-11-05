package com.servillantas.servicios.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "materiales_servicio", uniqueConstraints = {
        @UniqueConstraint(name = "uq_material_servicio_producto", columnNames = {"servicio_id", "producto_id"})
})
public class MaterialServicio {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public MaterialServicio() {
    }

    public MaterialServicio(UUID id, Servicio servicio, UUID productoId, BigDecimal cantidad, String idempotencyKey) {
        this.id = id != null ? id : UUID.randomUUID();
        this.servicio = servicio;
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
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

    public Servicio getServicio() {
        return servicio;
    }

    public void setServicio(Servicio servicio) {
        this.servicio = servicio;
    }

    public UUID getProductoId() {
        return productoId;
    }

    public void setProductoId(UUID productoId) {
        this.productoId = productoId;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
