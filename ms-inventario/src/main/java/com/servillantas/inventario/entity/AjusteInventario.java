
package com.servillantas.inventario.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "ajustes_inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AjusteInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    @Column(name = "cantidad", nullable = false, precision = 14, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "motivo", nullable = false, length = 300)
    private String motivo;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime fechaCreacion;
}
