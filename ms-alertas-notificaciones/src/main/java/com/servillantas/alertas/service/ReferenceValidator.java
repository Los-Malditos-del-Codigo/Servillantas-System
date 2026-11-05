package com.servillantas.alertas.service;

import com.servillantas.alertas.exception.RecursoNoEncontradoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ReferenceValidator {

    private static final Logger log = LoggerFactory.getLogger(ReferenceValidator.class);
    private final JdbcClient jdbc;

    public ReferenceValidator(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void producto(UUID id) {
        validar("select count(*) from productos where id=:id and activo=true", id, "Producto inexistente o inactivo");
    }

    public void usuario(UUID id) {
        validar("select count(*) from perfiles where id=:id and activo=true", id, "Usuario inexistente o inactivo");
    }

    private void validar(String sql, UUID id, String msg) {
        try {
            Long count = jdbc.sql(sql).param("id", id).query(Long.class).single();
            if (count == null || count == 0) {
                throw new RecursoNoEncontradoException(msg + ": " + id);
            }
        } catch (DataAccessException e) {
            log.warn("No se pudo verificar la referencia cruzada en BD ({}), se permite continuar: {}", msg, e.getMessage());
        }
    }
}
