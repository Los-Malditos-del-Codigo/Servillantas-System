package com.servillantas.asistente.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mensajes_ia")
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "conversacion_id", nullable = false)
    private UUID conversacionId;

    @Column(name = "rol_mensaje", nullable = false, length = 20)
    private String rolMensaje;

    @Column(name = "contenido", nullable = false, columnDefinition = "text")
    private String contenido;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Mensaje() {
    }

    public Mensaje(UUID conversacionId, String rolMensaje, String contenido) {
        this.conversacionId = conversacionId;
        this.rolMensaje = rolMensaje;
        this.contenido = contenido;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    // Getters y Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getConversacionId() {
        return conversacionId;
    }

    public void setConversacionId(UUID conversacionId) {
        this.conversacionId = conversacionId;
    }

    public String getRolMensaje() {
        return rolMensaje;
    }

    public void setRolMensaje(String rolMensaje) {
        this.rolMensaje = rolMensaje;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
