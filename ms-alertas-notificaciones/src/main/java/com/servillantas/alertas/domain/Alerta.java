package com.servillantas.alertas.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alertas")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo = "STOCK_BAJO";

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "ACTIVA";

    @Column(name = "mensaje", nullable = false, length = 500)
    private String mensaje;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "resuelta_at")
    private OffsetDateTime resueltaAt;

    public Alerta() {
    }

    public Alerta(UUID productoId, String mensaje) {
        this.productoId = productoId;
        this.mensaje = mensaje;
        this.tipo = "STOCK_BAJO";
        this.estado = "ACTIVA";
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PrePersist
    public void prePersist() {
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

    // Getters y Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProductoId() {
        return productoId;
    }

    public void setProductoId(UUID productoId) {
        this.productoId = productoId;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
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

    public OffsetDateTime getResueltaAt() {
        return resueltaAt;
    }

    public void setResueltaAt(OffsetDateTime resueltaAt) {
        this.resueltaAt = resueltaAt;
    }
}
