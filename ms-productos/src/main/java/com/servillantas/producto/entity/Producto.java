package com.servillantas.producto.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id")
    private Marca marca;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidad_medida_id", nullable = false)
    private UnidadMedida unidadMedida;

    @Column(name = "precio", precision = 12, scale = 2, nullable = false)
    private BigDecimal precioVenta;

    @Column(name = "stock_minimo", precision = 14, scale = 3, nullable = false)
    private BigDecimal stockMinimo;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime fechaCreacion;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = OffsetDateTime.now();
        }
        if (this.fechaActualizacion == null) {
            this.fechaActualizacion = OffsetDateTime.now();
        }
        if (this.activo == null) {
            this.activo = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = OffsetDateTime.now();
    }
}
