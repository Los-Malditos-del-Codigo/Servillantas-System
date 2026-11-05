package com.servillantas.compras.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servillantas.compras.dto.CrearProveedorRequestDto;
import com.servillantas.compras.dto.PageResponseDto;
import com.servillantas.compras.dto.ProveedorDto;
import com.servillantas.compras.exception.DuplicadoException;
import com.servillantas.compras.exception.GlobalExceptionHandler;
import com.servillantas.compras.service.ProveedoresService;
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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProveedoresController.class)
@Import(GlobalExceptionHandler.class)
class ProveedoresControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ProveedoresService proveedoresService;

    @Test
    @DisplayName("HU-14: Registrar proveedor exitoso responde 201 y Location")
    void crearProveedor_Exitoso() throws Exception {
        UUID id = UUID.randomUUID();
        CrearProveedorRequestDto request = new CrearProveedorRequestDto(
                "Distribuidora Llantas del Sur",
                "20123456789",
                "999888777",
                "ventas@llantasdelsur.pe",
                "Av. Industrial 123"
        );

        ProveedorDto respuesta = new ProveedorDto(
                id,
                "Distribuidora Llantas del Sur",
                "20123456789",
                "999888777",
                "ventas@llantasdelsur.pe",
                "Av. Industrial 123",
                true,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        when(proveedoresService.crearProveedor(any(CrearProveedorRequestDto.class))).thenReturn(respuesta);

        mockMvc.perform(post("/api/v1/proveedores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/proveedores/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.nombre").value("Distribuidora Llantas del Sur"))
                .andExpect(jsonPath("$.ruc").value("20123456789"))
                .andExpect(jsonPath("$.activo").value(true));
    }

    @Test
    @DisplayName("HU-14: Rechazar proveedor con RUC inválido (no 11 dígitos)")
    void crearProveedor_RucInvalido_Responde400() throws Exception {
        CrearProveedorRequestDto request = new CrearProveedorRequestDto(
                "Proveedor Test",
                "123", // RUC no válido
                "999888777",
                "test@test.com",
                "Av Test"
        );

        mockMvc.perform(post("/api/v1/proveedores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("VALIDACION"));
    }

    @Test
    @DisplayName("HU-14: Rechazar proveedor con RUC duplicado responde 409")
    void crearProveedor_RucDuplicado_Responde409() throws Exception {
        CrearProveedorRequestDto request = new CrearProveedorRequestDto(
                "Proveedor Repetido",
                "20123456789",
                "999888777",
                "test@test.com",
                "Av Test"
        );

        when(proveedoresService.crearProveedor(any(CrearProveedorRequestDto.class)))
                .thenThrow(new DuplicadoException("Ya existe un proveedor registrado con el RUC: 20123456789"));

        mockMvc.perform(post("/api/v1/proveedores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICADO"));
    }

    @Test
    @DisplayName("HU-15: Listar y buscar proveedores responde 200 con paginación")
    void listarProveedores_Exitoso() throws Exception {
        UUID id = UUID.randomUUID();
        ProveedorDto p = new ProveedorDto(
                id, "Michelin Peru", "20100100100", "987654321", "contacto@michelin.pe", "Av. Principal 456", true,
                OffsetDateTime.now(), OffsetDateTime.now()
        );

        PageResponseDto<ProveedorDto> pageResponse = PageResponseDto.from(
                new PageImpl<>(List.of(p), PageRequest.of(0, 10), 1)
        );

        when(proveedoresService.listarProveedores(eq("Michelin"), eq(true), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/proveedores")
                        .param("busqueda", "Michelin")
                        .param("activo", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_elements").value(1))
                .andExpect(jsonPath("$.content[0].nombre").value("Michelin Peru"));
    }
}
