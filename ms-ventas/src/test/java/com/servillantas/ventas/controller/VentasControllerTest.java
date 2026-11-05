package com.servillantas.ventas.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servillantas.ventas.config.UsuarioActualProvider;
import com.servillantas.ventas.dto.*;
import com.servillantas.ventas.exception.GlobalExceptionHandler;
import com.servillantas.ventas.exception.IdempotencyConflictException;
import com.servillantas.ventas.exception.RecursoNoEncontradoException;
import com.servillantas.ventas.service.VentasService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = VentasController.class)
@Import(GlobalExceptionHandler.class)
class VentasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private VentasService ventasService;

    @MockitoBean
    private UsuarioActualProvider usuarioActualProvider;

    @Test
    @DisplayName("POST /api/v1/ventas con datos válidos retorna 201 Created y header Location")
    void registrarVenta_Creado() throws Exception {
        UUID ventaId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta de prueba",
                List.of(new CrearVentaItemDto(productoId, new BigDecimal("2"), new BigDecimal("100.00")))
        );

        VentaDetalleDto responseDto = new VentaDetalleDto(
                ventaId,
                usuarioId,
                "CONFIRMADA",
                OffsetDateTime.now(),
                new BigDecimal("200.00"),
                "Venta de prueba",
                List.of(new DetalleVentaDto(UUID.randomUUID(), productoId, new BigDecimal("2"), new BigDecimal("100.00"), new BigDecimal("200.00"))),
                OffsetDateTime.now(),
                null,
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(usuarioActualProvider.getUsuarioId()).thenReturn(usuarioId);
        when(ventasService.registrarVenta(any(), eq(idempotencyKey), any(), eq(usuarioId)))
                .thenReturn(new VentasService.RegistroVentaResult(responseDto, false));

        mockMvc.perform(post("/api/v1/ventas")
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(ventaId.toString()))
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"))
                .andExpect(jsonPath("$.total").value(200.00));
    }

    @Test
    @DisplayName("POST /api/v1/ventas idempotente retorna 200 OK y header Idempotent-Replayed")
    void registrarVenta_IdempotentReplay() throws Exception {
        UUID ventaId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta repetida",
                List.of(new CrearVentaItemDto(productoId, new BigDecimal("1"), new BigDecimal("80.00")))
        );

        VentaDetalleDto responseDto = new VentaDetalleDto(
                ventaId,
                usuarioId,
                "CONFIRMADA",
                OffsetDateTime.now(),
                new BigDecimal("80.00"),
                "Venta repetida",
                List.of(new DetalleVentaDto(UUID.randomUUID(), productoId, new BigDecimal("1"), new BigDecimal("80.00"), new BigDecimal("80.00"))),
                OffsetDateTime.now(),
                null,
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(usuarioActualProvider.getUsuarioId()).thenReturn(usuarioId);
        when(ventasService.registrarVenta(any(), eq(idempotencyKey), any(), eq(usuarioId)))
                .thenReturn(new VentasService.RegistroVentaResult(responseDto, true));

        mockMvc.perform(post("/api/v1/ventas")
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Idempotent-Replayed", "true"))
                .andExpect(jsonPath("$.id").value(ventaId.toString()));
    }

    @Test
    @DisplayName("POST /api/v1/ventas sin Idempotency-Key retorna 400 Bad Request")
    void registrarVenta_SinIdempotencyKey() throws Exception {
        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Sin header",
                List.of(new CrearVentaItemDto(UUID.randomUUID(), new BigDecimal("1"), new BigDecimal("10.00")))
        );

        mockMvc.perform(post("/api/v1/ventas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/ventas con items vacíos retorna 400 con ProblemDetail code VALIDACION")
    void registrarVenta_ItemsVacios_RetornaValidacion() throws Exception {
        CrearVentaRequestDto request = new CrearVentaRequestDto("Vacía", List.of());

        mockMvc.perform(post("/api/v1/ventas")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACION"));
    }

    @Test
    @DisplayName("GET /api/v1/ventas/{id} no existente retorna 404 ProblemDetail NO_ENCONTRADO")
    void obtenerPorId_NoExiste() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(ventasService.obtenerVentaPorId(randomId))
                .thenThrow(new RecursoNoEncontradoException("No se encontró la venta con ID: " + randomId));

        mockMvc.perform(get("/api/v1/ventas/{id}", randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NO_ENCONTRADO"));
    }
}
