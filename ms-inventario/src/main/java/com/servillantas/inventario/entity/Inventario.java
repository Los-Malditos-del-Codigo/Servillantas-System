
package com.servillantas.inventario.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventario", indexes = {
        @Index(name = "ix_inventario_stock", columnList = "stock_actual")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "producto_id", nullable = false, unique = true)
    private UUID productoId;

    @Column(name = "stock_actual", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal stockActual = BigDecimal.ZERO;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime fechaActualizacion;
}
