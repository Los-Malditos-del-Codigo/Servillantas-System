package com.servillantas.rv.autenticacion.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rol {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 50)
	private String nombre;

	@Column(columnDefinition = "text")
	private String descripcion;

	@Column(nullable = false)
	private Boolean activo;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	@PrePersist
	public void prePersist() {
		if (this.createdAt == null) {
			this.createdAt = OffsetDateTime.now();
		}
		if (this.updatedAt == null) {
			this.updatedAt = OffsetDateTime.now();
		}
	}

	@PreUpdate
	public void preUpdate() {
		this.updatedAt = OffsetDateTime.now();
	}
}
