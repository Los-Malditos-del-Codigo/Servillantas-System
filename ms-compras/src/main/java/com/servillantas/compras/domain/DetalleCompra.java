package com.servillantas.compras.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "detalle_compras")
public class DetalleCompra {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compra_id", nullable = false)
    private Compra compra;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "cantidad", nullable = false, precision = 14, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "costo_unitario", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoUnitario;

    /**
     * Subtotal es una columna generada (GENERATED ALWAYS AS (round(cantidad * costo_unitario, 2))) en PostgreSQL.
     * Mapeada como insertable = false y updatable = false para cumplir con ddl-auto=validate y evitar errores de inserción.
     */
    @Column(name = "subtotal", insertable = false, updatable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public DetalleCompra() {
    }

    public DetalleCompra(UUID id, Compra compra, UUID productoId, BigDecimal cantidad, BigDecimal costoUnitario) {
        this.id = id != null ? id : UUID.randomUUID();
        this.compra = compra;
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.costoUnitario = costoUnitario;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public BigDecimal calcularSubtotal() {
        if (this.cantidad != null && this.costoUnitario != null) {
            return this.cantidad.multiply(this.costoUnitario).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Compra getCompra() {
        return compra;
    }

    public void setCompra(Compra compra) {
        this.compra = compra;
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

    public BigDecimal getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(BigDecimal costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal != null ? subtotal : calcularSubtotal();
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
