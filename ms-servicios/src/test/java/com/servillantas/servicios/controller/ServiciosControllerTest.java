package com.servillantas.servicios.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servillantas.servicios.config.UsuarioActualProvider;
import com.servillantas.servicios.dto.*;
import com.servillantas.servicios.exception.GlobalExceptionHandler;
import com.servillantas.servicios.exception.RecursoNoEncontradoException;
import com.servillantas.servicios.service.ServiciosService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {ServiciosController.class, TiposServicioController.class})
@Import(GlobalExceptionHandler.class)
class ServiciosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ServiciosService serviciosService;

    @MockitoBean
    private UsuarioActualProvider usuarioActualProvider;

    @Test
    @DisplayName("GET /api/v1/tipos-servicio retorna lista de tipos activos")
    void listarTiposServicio() throws Exception {
        UUID tipoId = UUID.randomUUID();
        when(serviciosService.listarTiposServicio(true)).thenReturn(List.of(
                new TipoServicioDto(tipoId, "Alineación", "Alineación láser", new BigDecimal("50.00"), true)
        ));

        mockMvc.perform(get("/api/v1/tipos-servicio").param("activo", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(tipoId.toString()))
                .andExpect(jsonPath("$[0].nombre").value("Alineación"));
    }

    @Test
    @DisplayName("POST /api/v1/servicios con datos válidos retorna 201 Created y header Location")
    void registrarServicio_Creado() throws Exception {
        UUID servicioId = UUID.randomUUID();
        UUID tipoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();

        CrearServicioRequestDto request = new CrearServicioRequestDto(
                tipoId,
                new BigDecimal("50.00"),
                OffsetDateTime.now(),
                "Servicio de alineación"
        );

        ServicioDetalleDto responseDto = new ServicioDetalleDto(
                servicioId,
                tipoId,
                "Alineación",
                usuarioId,
                new BigDecimal("50.00"),
                OffsetDateTime.now(),
                "Servicio de alineación",
                "REALIZADO",
                null,
                null,
                List.of(),
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(usuarioActualProvider.getUsuarioId()).thenReturn(usuarioId);
        when(serviciosService.registrarServicio(any(), eq(idempotencyKey), any(), eq(usuarioId)))
                .thenReturn(new ServiciosService.RegistroServicioResult(responseDto, false));

        mockMvc.perform(post("/api/v1/servicios")
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(servicioId.toString()))
                .andExpect(jsonPath("$.estado").value("REALIZADO"));
    }

    @Test
    @DisplayName("POST /api/v1/servicios sin Idempotency-Key retorna 400 ProblemDetail VALIDACION")
    void registrarServicio_SinIdempotencyKey() throws Exception {
        CrearServicioRequestDto request = new CrearServicioRequestDto(
                UUID.randomUUID(), new BigDecimal("50.00"), null, null
        );

        mockMvc.perform(post("/api/v1/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACION"));
    }

    @Test
    @DisplayName("POST /api/v1/servicios/{id}/materiales registra material y retorna 201")
    void agregarMaterial_Creado() throws Exception {
        UUID servicioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();

        CrearMaterialRequestDto request = new CrearMaterialRequestDto(productoId, new BigDecimal("2"));
        MaterialServicioDto responseDto = new MaterialServicioDto(materialId, productoId, new BigDecimal("2"), OffsetDateTime.now());

        when(serviciosService.agregarMaterial(eq(servicioId), any(), eq(idempotencyKey), any()))
                .thenReturn(new ServiciosService.RegistroMaterialResult(responseDto, false));

        mockMvc.perform(post("/api/v1/servicios/{id}/materiales", servicioId)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(materialId.toString()))
                .andExpect(jsonPath("$.producto_id").value(productoId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/servicios/{id} no existente retorna 404 ProblemDetail NO_ENCONTRADO")
    void obtenerPorId_NoExiste() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(serviciosService.obtenerServicioPorId(randomId))
                .thenThrow(new RecursoNoEncontradoException("No se encontró el servicio con ID: " + randomId));

        mockMvc.perform(get("/api/v1/servicios/{id}", randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NO_ENCONTRADO"));
    }
}
