package com.servillantas.compras.service;

import com.servillantas.compras.client.InventarioClient;
import com.servillantas.compras.config.UsuarioActualProvider;
import com.servillantas.compras.domain.Compra;
import com.servillantas.compras.domain.DetalleCompra;
import com.servillantas.compras.domain.Proveedor;
import com.servillantas.compras.dto.CompraDetalleDto;
import com.servillantas.compras.dto.CrearCompraItemDto;
import com.servillantas.compras.dto.CrearCompraRequestDto;
import com.servillantas.compras.exception.*;
import com.servillantas.compras.repository.CompraRepository;
import com.servillantas.compras.repository.DetalleCompraRepository;
import com.servillantas.compras.repository.ProductoRepository;
import com.servillantas.compras.repository.ProveedorRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComprasServiceTest {

    @Mock
    private CompraRepository compraRepository;

    @Mock
    private DetalleCompraRepository detalleCompraRepository;

    @Mock
    private ProveedorRepository proveedorRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private InventarioClient inventarioClient;

    @Mock
    private UsuarioActualProvider usuarioActualProvider;

    @InjectMocks
    private ComprasService comprasService;

    private Proveedor proveedorActivo;
    private UUID proveedorId;
    private UUID productoId1;
    private UUID productoId2;
    private UUID usuarioId;

    @BeforeEach
    void setUp() {
        proveedorId = UUID.randomUUID();
        productoId1 = UUID.randomUUID();
        productoId2 = UUID.randomUUID();
        usuarioId = UUID.randomUUID();

        proveedorActivo = new Proveedor(proveedorId, "Distribuidora San Martin", "20123456789", "999888777", "ventas@sanmartin.pe", "Av Lima 123", true);
    }

    @Test
    @DisplayName("HU-16: Registrar compra calcula totales correctamente y NO modifica inventario")
    void crearCompra_TotalesCorrectos_SinModificarInventario() {
        CrearCompraRequestDto request = new CrearCompraRequestDto(
                proveedorId,
                "Reposición mensual",
                List.of(
                        new CrearCompraItemDto(productoId1, new BigDecimal("4.000"), new BigDecimal("150.00")), // 600.00
                        new CrearCompraItemDto(productoId2, new BigDecimal("2.000"), new BigDecimal("250.50"))  // 501.00 -> total 1101.00
                )
        );

        when(compraRepository.findByIdempotencyKey("key-1")).thenReturn(Optional.empty());
        when(proveedorRepository.findById(proveedorId)).thenReturn(Optional.of(proveedorActivo));
        when(productoRepository.existsByIdAndActivoTrue(productoId1)).thenReturn(true);
        when(productoRepository.existsByIdAndActivoTrue(productoId2)).thenReturn(true);
        when(usuarioActualProvider.getUsuarioId()).thenReturn(usuarioId);
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> inv.getArgument(0));

        CompraDetalleDto resultado = comprasService.crearCompra(request, "key-1", UUID.randomUUID());

        assertThat(resultado).isNotNull();
        assertThat(resultado.estado()).isEqualTo("REGISTRADA");
        assertThat(resultado.total()).isEqualByComparingTo(new BigDecimal("1101.00"));
        assertThat(resultado.items()).hasSize(2);
        assertThat(resultado.items().get(0).subtotal()).isEqualByComparingTo(new BigDecimal("600.00"));
        assertThat(resultado.items().get(1).subtotal()).isEqualByComparingTo(new BigDecimal("501.00"));

        // Verificación crítica: NO se invoca inventario al crear la compra
        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("HU-16: Idempotencia - Misma clave y mismo contenido devuelve compra existente")
    void crearCompra_MismaClaveMismoContenido_DevuelveExistente() {
        Compra existente = new Compra(UUID.randomUUID(), proveedorActivo, usuarioId, "key-idemp", "Reposición", null);
        existente.setTotal(new BigDecimal("300.00"));
        existente.addItem(new DetalleCompra(UUID.randomUUID(), existente, productoId1, new BigDecimal("2.000"), new BigDecimal("150.00")));

        when(compraRepository.findByIdempotencyKey("key-idemp")).thenReturn(Optional.of(existente));

        CrearCompraRequestDto request = new CrearCompraRequestDto(
                proveedorId,
                "Reposición",
                List.of(new CrearCompraItemDto(productoId1, new BigDecimal("2.000"), new BigDecimal("150.00")))
        );

        CompraDetalleDto resultado = comprasService.crearCompra(request, "key-idemp", null);

        assertThat(resultado.id()).isEqualTo(existente.getId());
        verify(compraRepository, never()).save(any());
        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("HU-16: Idempotencia - Misma clave con contenido distinto arroja 409 IdempotencyConflictException")
    void crearCompra_MismaClaveDistintoContenido_Conflicto() {
        Compra existente = new Compra(UUID.randomUUID(), proveedorActivo, usuarioId, "key-idemp", "Reposición", null);
        existente.addItem(new DetalleCompra(UUID.randomUUID(), existente, productoId1, new BigDecimal("2.000"), new BigDecimal("150.00")));

        when(compraRepository.findByIdempotencyKey("key-idemp")).thenReturn(Optional.of(existente));

        CrearCompraRequestDto requestDistinto = new CrearCompraRequestDto(
                proveedorId,
                "Reposición modificada",
                List.of(new CrearCompraItemDto(productoId1, new BigDecimal("5.000"), new BigDecimal("150.00")))
        );

        assertThatThrownBy(() -> comprasService.crearCompra(requestDistinto, "key-idemp", null))
                .isInstanceOf(IdempotencyConflictException.class);
    }

    @Test
    @DisplayName("HU-16: Rechaza compra con productos repetidos en el mismo request")
    void crearCompra_ProductosRepetidos_ArrojaValidacionException() {
        when(compraRepository.findByIdempotencyKey("key-rep")).thenReturn(Optional.empty());
        when(proveedorRepository.findById(proveedorId)).thenReturn(Optional.of(proveedorActivo));

        CrearCompraRequestDto request = new CrearCompraRequestDto(
                proveedorId,
                "Reposición",
                List.of(
                        new CrearCompraItemDto(productoId1, new BigDecimal("2.000"), new BigDecimal("100.00")),
                        new CrearCompraItemDto(productoId1, new BigDecimal("3.000"), new BigDecimal("100.00"))
                )
        );

        assertThatThrownBy(() -> comprasService.crearCompra(request, "key-rep", null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("repetidos");
    }

    @Test
    @DisplayName("HU-46: Confirmar recepción invoca MS-Inventario con clave determinística y marca compra como RECIBIDA")
    void confirmarRecepcion_Exitoso() {
        UUID compraId = UUID.randomUUID();
        Compra compra = new Compra(compraId, proveedorActivo, usuarioId, "key-compra", "Reposición", UUID.randomUUID());
        UUID detalleId1 = UUID.randomUUID();
        DetalleCompra detalle = new DetalleCompra(detalleId1, compra, productoId1, new BigDecimal("10.000"), new BigDecimal("50.00"));
        compra.addItem(detalle);

        when(compraRepository.findByIdWithLock(compraId)).thenReturn(Optional.of(compra));
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> inv.getArgument(0));

        CompraDetalleDto confirmada = comprasService.confirmarRecepcion(compraId, "rec-key-1", null);

        assertThat(confirmada.estado()).isEqualTo("RECIBIDA");
        assertThat(confirmada.recibidaAt()).isNotNull();

        // Clave determinística verificada
        String expectedKey = "compra-" + compraId + "-item-" + detalleId1;
        verify(inventarioClient, times(1)).registrarEntrada(any(), eq(expectedKey), any());
    }

    @Test
    @DisplayName("HU-46: Confirmación repetida sobre compra ya RECIBIDA es idempotente y no re-invoca MS-Inventario")
    void confirmarRecepcion_YaRecibida_NoDuplicaInventario() {
        UUID compraId = UUID.randomUUID();
        Compra compra = new Compra(compraId, proveedorActivo, usuarioId, "key-compra", "Reposición", null);
        compra.setEstado("RECIBIDA");
        compra.setRecepcionIdempotencyKey("rec-key-1");
        compra.setRecibidaAt(OffsetDateTime.now());

        when(compraRepository.findByIdWithLock(compraId)).thenReturn(Optional.of(compra));

        CompraDetalleDto respuesta = comprasService.confirmarRecepcion(compraId, "rec-key-1", null);

        assertThat(respuesta.estado()).isEqualTo("RECIBIDA");
        verifyNoInteractions(inventarioClient);
        verify(compraRepository, never()).save(any());
    }

    @Test
    @DisplayName("HU-46: Rechaza confirmar recepción de compra en estado ANULADA")
    void confirmarRecepcion_CompraAnulada_ArrojaEstadoInvalido() {
        UUID compraId = UUID.randomUUID();
        Compra compra = new Compra(compraId, proveedorActivo, usuarioId, "key-compra", "Reposición", null);
        compra.setEstado("ANULADA");

        when(compraRepository.findByIdWithLock(compraId)).thenReturn(Optional.of(compra));

        assertThatThrownBy(() -> comprasService.confirmarRecepcion(compraId, "rec-key", null))
                .isInstanceOf(EstadoInvalidoException.class);

        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("HU-46: Fallo o timeout en MS-Inventario propaga InventarioNoDisponibleException y no marca compra como RECIBIDA")
    void confirmarRecepcion_FalloInventario_NoActualizaCompra() {
        UUID compraId = UUID.randomUUID();
        Compra compra = new Compra(compraId, proveedorActivo, usuarioId, "key-compra", "Reposición", null);
        DetalleCompra detalle = new DetalleCompra(UUID.randomUUID(), compra, productoId1, new BigDecimal("5.000"), new BigDecimal("100.00"));
        compra.addItem(detalle);

        when(compraRepository.findByIdWithLock(compraId)).thenReturn(Optional.of(compra));
        doThrow(new InventarioNoDisponibleException("MS-Inventario no disponible")).when(inventarioClient)
                .registrarEntrada(any(), any(), any());

        assertThatThrownBy(() -> comprasService.confirmarRecepcion(compraId, "rec-key", null))
                .isInstanceOf(InventarioNoDisponibleException.class);

        assertThat(compra.getEstado()).isEqualTo("REGISTRADA");
        verify(compraRepository, never()).save(any());
    }
}
