package com.servillantas.servicios.service;

import com.servillantas.servicios.client.InventarioClient;
import com.servillantas.servicios.client.MovimientoInventarioRequest;
import com.servillantas.servicios.domain.MaterialServicio;
import com.servillantas.servicios.domain.Servicio;
import com.servillantas.servicios.domain.ServicioEstado;
import com.servillantas.servicios.domain.TipoServicio;
import com.servillantas.servicios.dto.CrearMaterialRequestDto;
import com.servillantas.servicios.dto.CrearServicioRequestDto;
import com.servillantas.servicios.dto.TipoServicioDto;
import com.servillantas.servicios.exception.IdempotencyConflictException;
import com.servillantas.servicios.exception.RecursoNoEncontradoException;
import com.servillantas.servicios.exception.StockInsuficienteException;
import com.servillantas.servicios.exception.ValidacionException;
import com.servillantas.servicios.repository.MaterialServicioRepository;
import com.servillantas.servicios.repository.ServicioRepository;
import com.servillantas.servicios.repository.TipoServicioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiciosServiceTest {

    @Mock
    private TipoServicioRepository tipoServicioRepository;

    @Mock
    private ServicioRepository servicioRepository;

    @Mock
    private MaterialServicioRepository materialServicioRepository;

    @Mock
    private InventarioClient inventarioClient;

    @InjectMocks
    private ServiciosService serviciosService;

    private UUID usuarioId;
    private UUID tipoServicioId;
    private TipoServicio tipoActivo;

    @BeforeEach
    void setUp() {
        usuarioId = UUID.randomUUID();
        tipoServicioId = UUID.randomUUID();
        tipoActivo = new TipoServicio(tipoServicioId, "Alineación y Balanceo", "Alineación 3D", new BigDecimal("60.00"), true);
    }

    @Test
    @DisplayName("HU-20: Listar tipos de servicio activos para el select")
    void listarTiposServicioActivos() {
        when(tipoServicioRepository.findByActivo(true)).thenReturn(List.of(tipoActivo));

        List<TipoServicioDto> resultado = serviciosService.listarTiposServicio(true);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Alineación y Balanceo");
        assertThat(resultado.get(0).activo()).isTrue();
    }

    @Test
    @DisplayName("HU-20: Registrar servicio con tipo activo y precio válido es exitoso")
    void registrarServicio_Exitoso() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearServicioRequestDto request = new CrearServicioRequestDto(
                tipoServicioId,
                new BigDecimal("60.00"),
                OffsetDateTime.now(),
                "Alineación delantera"
        );

        when(servicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(tipoServicioRepository.findById(tipoServicioId)).thenReturn(Optional.of(tipoActivo));
        when(servicioRepository.saveAndFlush(any(Servicio.class))).thenAnswer(inv -> inv.getArgument(0));

        ServiciosService.RegistroServicioResult result = serviciosService.registrarServicio(
                request, idempotencyKey, correlationId, usuarioId
        );

        assertThat(result.replayed()).isFalse();
        assertThat(result.servicio()).isNotNull();
        assertThat(result.servicio().estado()).isEqualTo("REALIZADO");
        assertThat(result.servicio().precio()).isEqualByComparingTo(new BigDecimal("60.00"));
        verify(servicioRepository, times(1)).saveAndFlush(any(Servicio.class));
    }

    @Test
    @DisplayName("HU-20: Registrar servicio con tipo inexistente lanza NO_ENCONTRADO")
    void registrarServicio_TipoNoExiste() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearServicioRequestDto request = new CrearServicioRequestDto(
                tipoServicioId, new BigDecimal("60.00"), null, null
        );

        when(servicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(tipoServicioRepository.findById(tipoServicioId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serviciosService.registrarServicio(request, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("HU-20: Registrar servicio con tipo inactivo lanza VALIDACION")
    void registrarServicio_TipoInactivo() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        TipoServicio inactivo = new TipoServicio(tipoServicioId, "Cambio Aceite", "Desactivado", new BigDecimal("30.00"), false);

        CrearServicioRequestDto request = new CrearServicioRequestDto(
                tipoServicioId, new BigDecimal("30.00"), null, null
        );

        when(servicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(tipoServicioRepository.findById(tipoServicioId)).thenReturn(Optional.of(inactivo));

        assertThatThrownBy(() -> serviciosService.registrarServicio(request, idempotencyKey, correlationId, usuarioId))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("no está activo");
    }

    @Test
    @DisplayName("HU-20: Idempotencia en servicio repite 200 si payload es idéntico")
    void registrarServicio_Idempotencia_Replay() {
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        CrearServicioRequestDto request = new CrearServicioRequestDto(
                tipoServicioId, new BigDecimal("60.00"), null, "Nota"
        );

        Servicio existente = new Servicio(UUID.randomUUID(), tipoActivo, usuarioId, new BigDecimal("60.00"), OffsetDateTime.now(), "Nota", idempotencyKey, correlationId);
        when(servicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.of(existente));

        ServiciosService.RegistroServicioResult result = serviciosService.registrarServicio(
                request, idempotencyKey, correlationId, usuarioId
        );

        assertThat(result.replayed()).isTrue();
        assertThat(result.servicio().id()).isEqualTo(existente.getId());
        verify(servicioRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("HU-21: Agregar material exitoso llama a Inventario y persiste fila")
    void agregarMaterial_Exitoso() {
        UUID servicioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        Servicio servicio = new Servicio(servicioId, tipoActivo, usuarioId, new BigDecimal("60.00"), OffsetDateTime.now(), "Nota", "key-srv", correlationId);

        CrearMaterialRequestDto request = new CrearMaterialRequestDto(productoId, new BigDecimal("2"));

        when(servicioRepository.findById(servicioId)).thenReturn(Optional.of(servicio));
        when(materialServicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(materialServicioRepository.existsByServicioIdAndProductoId(servicioId, productoId)).thenReturn(false);
        when(materialServicioRepository.saveAndFlush(any(MaterialServicio.class))).thenAnswer(inv -> inv.getArgument(0));

        ServiciosService.RegistroMaterialResult result = serviciosService.agregarMaterial(
                servicioId, request, idempotencyKey, correlationId
        );

        assertThat(result.replayed()).isFalse();
        assertThat(result.material()).isNotNull();
        assertThat(result.material().productoId()).isEqualTo(productoId);
        assertThat(result.material().cantidad()).isEqualByComparingTo(new BigDecimal("2"));

        verify(inventarioClient, times(1)).registrarSalida(any(MovimientoInventarioRequest.class), eq(idempotencyKey + "-SALIDA"), eq(correlationId.toString()));
        verify(materialServicioRepository, times(1)).saveAndFlush(any(MaterialServicio.class));
    }

    @Test
    @DisplayName("HU-21: Agregar material repetido en el mismo servicio lanza VALIDACION")
    void agregarMaterial_ProductoDuplicado() {
        UUID servicioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        Servicio servicio = new Servicio(servicioId, tipoActivo, usuarioId, new BigDecimal("60.00"), OffsetDateTime.now(), "Nota", "key-srv", correlationId);

        CrearMaterialRequestDto request = new CrearMaterialRequestDto(productoId, new BigDecimal("1"));

        when(servicioRepository.findById(servicioId)).thenReturn(Optional.of(servicio));
        when(materialServicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(materialServicioRepository.existsByServicioIdAndProductoId(servicioId, productoId)).thenReturn(true);

        assertThatThrownBy(() -> serviciosService.agregarMaterial(servicioId, request, idempotencyKey, correlationId))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ya fue registrado como material");

        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("HU-21: Agregar material con stock insuficiente lanza STOCK_INSUFICIENTE sin persistir")
    void agregarMaterial_StockInsuficiente() {
        UUID servicioId = UUID.randomUUID();
        UUID productoId = UUID.randomUUID();
        String idempotencyKey = UUID.randomUUID().toString();
        UUID correlationId = UUID.randomUUID();

        Servicio servicio = new Servicio(servicioId, tipoActivo, usuarioId, new BigDecimal("60.00"), OffsetDateTime.now(), "Nota", "key-srv", correlationId);

        CrearMaterialRequestDto request = new CrearMaterialRequestDto(productoId, new BigDecimal("10"));

        when(servicioRepository.findById(servicioId)).thenReturn(Optional.of(servicio));
        when(materialServicioRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.empty());
        when(materialServicioRepository.existsByServicioIdAndProductoId(servicioId, productoId)).thenReturn(false);

        doThrow(new StockInsuficienteException("Stock insuficiente", productoId, BigDecimal.ZERO))
                .when(inventarioClient).registrarSalida(any(), any(), any());

        assertThatThrownBy(() -> serviciosService.agregarMaterial(servicioId, request, idempotencyKey, correlationId))
                .isInstanceOf(StockInsuficienteException.class);

        verify(materialServicioRepository, never()).saveAndFlush(any());
    }
}
