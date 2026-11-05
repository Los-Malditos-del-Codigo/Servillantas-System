package com.servillantas.ventas.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "detalle_ventas")
public class DetalleVenta {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    /**
     * Columna generada en BD: round((cantidad * precio_unitario), 2).
     * Mapeada como insertable = false, updatable = false.
     */
    @Column(name = "subtotal", insertable = false, updatable = false)
    private BigDecimal subtotal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public DetalleVenta() {
    }

    public DetalleVenta(UUID id, Venta venta, UUID productoId, BigDecimal cantidad, BigDecimal precioUnitario) {
        this.id = id != null ? id : UUID.randomUUID();
        this.venta = venta;
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
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

    public BigDecimal getSubtotalCalculado() {
        if (this.subtotal != null) {
            return this.subtotal;
        }
        if (this.cantidad != null && this.precioUnitario != null) {
            return this.cantidad.multiply(this.precioUnitario).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    // Getters y Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
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

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getSubtotal() {
        return getSubtotalCalculado();
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
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
}
