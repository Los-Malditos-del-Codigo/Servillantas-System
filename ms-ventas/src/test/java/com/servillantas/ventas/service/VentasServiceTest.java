package com.servillantas.ventas.service;

import com.servillantas.ventas.client.InventarioClient;
import com.servillantas.ventas.client.MovimientoInventarioRequest;
import com.servillantas.ventas.domain.DetalleVenta;
import com.servillantas.ventas.domain.Venta;
import com.servillantas.ventas.domain.VentaEstado;
import com.servillantas.ventas.dto.CrearVentaItemDto;
import com.servillantas.ventas.dto.CrearVentaRequestDto;
import com.servillantas.ventas.exception.IdempotencyConflictException;
import com.servillantas.ventas.exception.InventarioNoDisponibleException;
import com.servillantas.ventas.exception.StockInsuficienteException;
import com.servillantas.ventas.exception.ValidacionException;
import com.servillantas.ventas.repository.VentaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VentasServiceTest {

    @Mock
    private VentaRepository ventaRepository;

    @Mock
    private InventarioClient inventarioClient;

    @InjectMocks
    private VentasService ventasService;

    private UUID usuarioId;
    private UUID producto1;
    private UUID producto2;

    @BeforeEach
    void setUp() {
        usuarioId = UUID.randomUUID();
        producto1 = UUID.randomUUID();
        producto2 = UUID.randomUUID();
    }

    @Test
    @DisplayName("HU-18: Registrar venta exitosa descuenta stock de cada ítem y persiste en BD")
    void registrarVenta_Exitosa() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta de mostrador",
                List.of(
                        new CrearVentaItemDto(producto1, new BigDecimal("2"), new BigDecimal("150.00")),
                        new CrearVentaItemDto(producto2, new BigDecimal("1"), new BigDecimal("50.00"))
                )
        );

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VentasService.RegistroVentaResult result = ventasService.registrarVenta(
                request, idempotencyKey, correlationId, usuarioId
        );

        assertThat(result.replayed()).isFalse();
        assertThat(result.venta()).isNotNull();
        assertThat(result.venta().total()).isEqualByComparingTo(new BigDecimal("350.00"));
        assertThat(result.venta().items()).hasSize(2);

        // Se deben haber llamado 2 salidas en inventario con claves determinísticas
        verify(inventarioClient, times(2)).registrarSalida(any(MovimientoInventarioRequest.class), anyString(), eq(correlationId.toString()));
        verify(inventarioClient, never()).compensarEntrada(any(), any(), any());
    }

    @Test
    @DisplayName("HU-18: Misma Idempotency-Key con idéntico payload devuelve venta existente (replayed = true)")
    void registrarVenta_Idempotencia_Replay() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta repetida",
                List.of(new CrearVentaItemDto(producto1, new BigDecimal("2"), new BigDecimal("100.00")))
        );

        Venta ventaPrevia = new Venta(UUID.randomUUID(), usuarioId, "Venta repetida", idempotencyKey, correlationId);
        ventaPrevia.setEstado(VentaEstado.CONFIRMADA);
        ventaPrevia.setTotal(new BigDecimal("200.00"));
        DetalleVenta det = new DetalleVenta(UUID.randomUUID(), ventaPrevia, producto1, new BigDecimal("2"), new BigDecimal("100.00"));
        ventaPrevia.addItem(det);

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.of(ventaPrevia));

        VentasService.RegistroVentaResult result = ventasService.registrarVenta(
                request, idempotencyKey, correlationId, usuarioId
        );

        assertThat(result.replayed()).isTrue();
        assertThat(result.venta().id()).isEqualTo(ventaPrevia.getId());
        verifyNoInteractions(inventarioClient);
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("HU-18: Misma Idempotency-Key con payload diferente lanza IDEMPOTENCY_KEY_CONFLICT")
    void registrarVenta_Idempotencia_Conflicto() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto requestNuevo = new CrearVentaRequestDto(
                "Venta modificada",
                List.of(new CrearVentaItemDto(producto1, new BigDecimal("5"), new BigDecimal("100.00")))
        );

        Venta ventaPrevia = new Venta(UUID.randomUUID(), usuarioId, "Venta original", idempotencyKey, correlationId);
        ventaPrevia.setEstado(VentaEstado.CONFIRMADA);
        DetalleVenta det = new DetalleVenta(UUID.randomUUID(), ventaPrevia, producto1, new BigDecimal("2"), new BigDecimal("100.00"));
        ventaPrevia.addItem(det);

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.of(ventaPrevia));

        assertThatThrownBy(() -> ventasService.registrarVenta(requestNuevo, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(IdempotencyConflictException.class)
                .hasMessageContaining("ya fue usada previamente");

        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("HU-18: Stock insuficiente en segunda línea compensa la primera salida y no persiste")
    void registrarVenta_StockInsuficiente_CompensaSalidas() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta sin stock",
                List.of(
                        new CrearVentaItemDto(producto1, new BigDecimal("1"), new BigDecimal("50.00")),
                        new CrearVentaItemDto(producto2, new BigDecimal("100"), new BigDecimal("20.00"))
                )
        );

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());

        // La primera llamada a salida funciona, la segunda lanza StockInsuficienteException
        doNothing()
                .doThrow(new StockInsuficienteException("Stock insuficiente", producto2, BigDecimal.ZERO))
                .when(inventarioClient).registrarSalida(any(), anyString(), anyString());

        assertThatThrownBy(() -> ventasService.registrarVenta(request, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(StockInsuficienteException.class);

        // Se verifica que se compensó la primera salida
        verify(inventarioClient, times(1)).compensarEntrada(any(MovimientoInventarioRequest.class), anyString(), anyString());
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("HU-18: Si MS-Inventario no está disponible, lanza INVENTARIO_NO_DISPONIBLE sin persistir")
    void registrarVenta_InventarioNoDisponible() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta timeout",
                List.of(new CrearVentaItemDto(producto1, new BigDecimal("1"), new BigDecimal("50.00")))
        );

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        doThrow(new InventarioNoDisponibleException("Inventario caído"))
                .when(inventarioClient).registrarSalida(any(), anyString(), anyString());

        assertThatThrownBy(() -> ventasService.registrarVenta(request, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(InventarioNoDisponibleException.class);

        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("HU-18: Validación rechaza productos duplicados en una misma venta")
    void registrarVenta_ProductosDuplicados() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearVentaRequestDto request = new CrearVentaRequestDto(
                "Venta duplicada",
                List.of(
                        new CrearVentaItemDto(producto1, new BigDecimal("1"), new BigDecimal("50.00")),
                        new CrearVentaItemDto(producto1, new BigDecimal("2"), new BigDecimal("50.00"))
                )
        );

        when(ventaRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ventasService.registrarVenta(request, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("No se permiten productos repetidos");

        verifyNoInteractions(inventarioClient);
    }
}
