
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
@Table(name = "movimientos_inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "producto_id", nullable = false)
    private UUID productoId;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo;

    @Column(name = "cantidad", nullable = false, precision = 14, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "stock_anterior", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockAnterior;

    @Column(name = "stock_resultante", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockResultante;

    @Column(name = "origen", nullable = false, length = 30)
    private String origen;

    @Column(name = "referencia_id")
    private UUID referenciaId;

    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @Column(name = "correlation_id")
    private UUID correlationId;

    @Column(name = "observacion", length = 500)
    private String observacion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime fechaCreacion;
}
