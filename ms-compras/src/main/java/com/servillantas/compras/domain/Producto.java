package com.servillantas.compras.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.util.UUID;

/**
 * Entidad de solo lectura para validar la existencia y estado activo de productos al registrar compras.
 * No establece relaciones de clave foránea en DetalleCompra para mantener desacoplamiento de microservicios.
 */
@Entity
@Table(name = "productos")
@Immutable
public class Producto {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "codigo", length = 50)
    private String codigo;

    @Column(name = "nombre", length = 150)
    private String nombre;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    public Producto() {
    }

    public Producto(UUID id, String codigo, String nombre, Boolean activo) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.activo = activo;
    }

    public UUID getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public Boolean getActivo() {
        return activo;
    }
}
