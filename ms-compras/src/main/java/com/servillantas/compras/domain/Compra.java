package com.servillantas.compras.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "compras")
public class Compra {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "REGISTRADA";

    @Column(name = "fecha", nullable = false)
    private OffsetDateTime fecha;

    @Column(name = "total", nullable = false, precision = 14, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "observacion", columnDefinition = "text")
    private String observacion;

    @Column(name = "motivo_anulacion", length = 500)
    private String motivoAnulacion;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "recepcion_idempotency_key", length = 120)
    private String recepcionIdempotencyKey;

    @Column(name = "correlation_id")
    private UUID correlationId;

    @Column(name = "recibida_at")
    private OffsetDateTime recibidaAt;

    @Column(name = "anulada_at")
    private OffsetDateTime anuladaAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleCompra> items = new ArrayList<>();

    public Compra() {
    }

    public Compra(UUID id, Proveedor proveedor, UUID usuarioId, String idempotencyKey, String observacion, UUID correlationId) {
        this.id = id != null ? id : UUID.randomUUID();
        this.proveedor = proveedor;
        this.usuarioId = usuarioId;
        this.idempotencyKey = idempotencyKey;
        this.observacion = observacion;
        this.correlationId = correlationId;
        this.estado = "REGISTRADA";
        this.fecha = OffsetDateTime.now();
        this.total = BigDecimal.ZERO;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.estado == null) {
            this.estado = "REGISTRADA";
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (this.fecha == null) {
            this.fecha = now;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.total == null) {
            this.total = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void addItem(DetalleCompra item) {
        items.add(item);
        item.setCompra(this);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(UUID usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
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

    public String getRecepcionIdempotencyKey() {
        return recepcionIdempotencyKey;
    }

    public void setRecepcionIdempotencyKey(String recepcionIdempotencyKey) {
        this.recepcionIdempotencyKey = recepcionIdempotencyKey;
    }

    public UUID getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(UUID correlationId) {
        this.correlationId = correlationId;
    }

    public OffsetDateTime getRecibidaAt() {
        return recibidaAt;
    }

    public void setRecibidaAt(OffsetDateTime recibidaAt) {
        this.recibidaAt = recibidaAt;
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

    public List<DetalleCompra> getItems() {
        return items;
    }

    public void setItems(List<DetalleCompra> items) {
        this.items = items;
    }
}
