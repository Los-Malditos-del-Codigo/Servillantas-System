package com.servillantas.compras.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servillantas.compras.dto.*;
import com.servillantas.compras.exception.GlobalExceptionHandler;
import com.servillantas.compras.service.ComprasService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

@WebMvcTest(controllers = ComprasController.class)
@Import(GlobalExceptionHandler.class)
class ComprasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ComprasService comprasService;

    @Test
    @DisplayName("HU-16: Registrar compra con Idempotency-Key exitoso responde 201 y Location")
    void crearCompra_Exitoso() throws Exception {
        UUID compraId = UUID.randomUUID();
        UUID proveedorId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();

        CrearCompraRequestDto request = new CrearCompraRequestDto(
                proveedorId,
                "Reposición mensual de llantas",
                List.of(new CrearCompraItemDto(productoId, new BigDecimal("10.000"), new BigDecimal("150.00")))
        );

        CompraDetalleDto respuesta = new CompraDetalleDto(
                compraId,
                new ProveedorResumenDto(proveedorId, "Proveedor Test", "20123456789"),
                usuarioId,
                "REGISTRADA",
                OffsetDateTime.now(),
                new BigDecimal("1500.00"),
                "Reposición mensual de llantas",
                null,
                null,
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                List.of(new DetalleCompraDto(UUID.randomUUID(), productoId, new BigDecimal("10.000"), new BigDecimal("150.00"), new BigDecimal("1500.00")))
        );

        when(comprasService.crearCompra(any(CrearCompraRequestDto.class), eq("idemp-compra-123"), any())).thenReturn(respuesta);

        mockMvc.perform(post("/api/v1/compras")
                        .header("Idempotency-Key", "idemp-compra-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/compras/" + compraId))
                .andExpect(jsonPath("$.id").value(compraId.toString()))
                .andExpect(jsonPath("$.estado").value("REGISTRADA"))
                .andExpect(jsonPath("$.total").value(1500.00))
                .andExpect(jsonPath("$.items[0].producto_id").value(productoId.toString()));
    }

    @Test
    @DisplayName("HU-16: Registrar compra sin header Idempotency-Key responde 400 Bad Request")
    void crearCompra_SinIdempotencyKey_Responde400() throws Exception {
        CrearCompraRequestDto request = new CrearCompraRequestDto(
                UUID.randomUUID(),
                "Reposición",
                List.of(new CrearCompraItemDto(UUID.randomUUID(), BigDecimal.ONE, BigDecimal.TEN))
        );

        mockMvc.perform(post("/api/v1/compras")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("VALIDACION"));
    }

    @Test
    @DisplayName("HU-17: Consultar historial de compras responde 200 con listado paginado")
    void listarCompras_Exitoso() throws Exception {
        UUID compraId = UUID.randomUUID();
        UUID proveedorId = UUID.randomUUID();

        CompraResumenDto resumen = new CompraResumenDto(
                compraId,
                new ProveedorResumenDto(proveedorId, "Proveedor Test", "20123456789"),
                UUID.randomUUID(),
                "REGISTRADA",
                OffsetDateTime.now(),
                new BigDecimal("500.00"),
                "Observacion",
                null,
                null,
                OffsetDateTime.now()
        );

        PageResponseDto<CompraResumenDto> pageResponse = PageResponseDto.from(
                new PageImpl<>(List.of(resumen), PageRequest.of(0, 10), 1)
        );

        when(comprasService.listarCompras(any(), any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/compras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_elements").value(1))
                .andExpect(jsonPath("$.content[0].estado").value("REGISTRADA"));
    }

    @Test
    @DisplayName("HU-46: Confirmar recepción de compra responde 200 y estado RECIBIDA")
    void confirmarRecepcion_Exitoso() throws Exception {
        UUID compraId = UUID.randomUUID();
        UUID proveedorId = UUID.randomUUID();

        CompraDetalleDto respuesta = new CompraDetalleDto(
                compraId,
                new ProveedorResumenDto(proveedorId, "Proveedor Test", "20123456789"),
                UUID.randomUUID(),
                "RECIBIDA",
                OffsetDateTime.now(),
                new BigDecimal("1500.00"),
                "Reposición",
                null,
                OffsetDateTime.now(),
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                List.of()
        );

        when(comprasService.confirmarRecepcion(eq(compraId), eq("idemp-rec-123"), any())).thenReturn(respuesta);

        mockMvc.perform(post("/api/v1/compras/" + compraId + "/recepcion")
                        .header("Idempotency-Key", "idemp-rec-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(compraId.toString()))
                .andExpect(jsonPath("$.estado").value("RECIBIDA"))
                .andExpect(jsonPath("$.recibida_at").isNotEmpty());
    }
}
