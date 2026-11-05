package com.servillantas.rv.autenticacion.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "perfiles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Perfil {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 100)
	private String nombres;

	@Column(length = 100)
	private String apellidos;

	@Column(length = 30)
	private String telefono;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "rol_id", nullable = false)
	private Rol rol;

	@Column(nullable = false)
	private Boolean activo;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	@Column(nullable = false, unique = true, length = 150)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;
	
	@Column(name = "requiere_cambio_password", nullable = false)
    private Boolean requiereCambioPassword = false;

}