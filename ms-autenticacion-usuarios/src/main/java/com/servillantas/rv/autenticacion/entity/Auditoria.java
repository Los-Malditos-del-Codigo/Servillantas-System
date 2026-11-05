package com.servillantas.rv.autenticacion.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//@Entity
@Table(name = "auditoria", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Auditoria {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "usuario_id")
	private UUID usuarioId;

	@Column(name = "tabla_afectada", nullable = false, length = 100)
	private String tablaAfectada;

	@Column(name = "registro_id")
	private UUID registroId;

	@Column(nullable = false, length = 20)
	private String accion;

	@Column(name = "datos_anteriores", columnDefinition = "jsonb")
	private String datosAnteriores;

	@Column(name = "datos_nuevos", columnDefinition = "jsonb")
	private String datosNuevos;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;
}