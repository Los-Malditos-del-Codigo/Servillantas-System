package com.servillantas.producto.service.impservice;

import com.servillantas.producto.dto.producto.ProductoRequest;
import com.servillantas.producto.dto.producto.ProductoResponse;
import com.servillantas.producto.entity.Categoria;
import com.servillantas.producto.entity.Marca;
import com.servillantas.producto.entity.Producto;
import com.servillantas.producto.entity.UnidadMedida;
import com.servillantas.producto.exception.ResourceNotFoundException;
import com.servillantas.producto.mapper.ProductoMapper;
import com.servillantas.producto.repository.CategoriaRepository;
import com.servillantas.producto.repository.MarcaRepository;
import com.servillantas.producto.repository.ProductoRepository;
import com.servillantas.producto.repository.UnidadMedidaRepository;
import com.servillantas.producto.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;

    private final ProductoMapper productoMapper;

    @Override
    @Transactional
    public ProductoResponse crear(ProductoRequest request) {

        Categoria categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: "
                                        + request.categoriaId()
                        )
                );

        Marca marca = null;

        if (request.marcaId() != null) {
            marca = marcaRepository.findById(request.marcaId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Marca no encontrada con id: "
                                            + request.marcaId()
                            )
                    );
        }

        UnidadMedida unidadMedida = unidadMedidaRepository
                .findById(request.unidadMedidaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: "
                                        + request.unidadMedidaId()
                        )
                );

        Producto producto = productoMapper.toEntity(request);

        // Todo producto nuevo nace activo si el cliente no envía el estado.
        if (producto.getActivo() == null) {
            producto.setActivo(true);
        }

        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setUnidadMedida(unidadMedida);

        OffsetDateTime ahora = OffsetDateTime.now();

        producto.setFechaCreacion(ahora);
        producto.setFechaActualizacion(ahora);

        Producto productoGuardado = productoRepository.save(producto);

        return productoMapper.toResponse(productoGuardado);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(UUID id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id
                        )
                );

        return productoMapper.toResponse(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> obtenerTodos(
            String search,
            UUID categoriaId,
            UUID marcaId,
            boolean includeInactivos
    ) {

        String termino = (search == null)
                ? null
                : search.trim().toLowerCase(Locale.ROOT);

        return productoRepository.findAll()
                .stream()
                .filter(producto ->
                        includeInactivos || Boolean.TRUE.equals(producto.getActivo()))
                .filter(producto ->
                        categoriaId == null || producto.getCategoria().getId()
                                .equals(categoriaId))
                .filter(producto ->
                        marcaId == null || (producto.getMarca() != null
                                && producto.getMarca().getId()
                                        .equals(marcaId)))
                .filter(producto -> {
                    if (termino == null || termino.isEmpty()) {
                        return true;
                    }

                    return coincidenBusqueda(producto, termino);
                })
                .map(productoMapper::toResponse)
                .toList();
    }

    private boolean coincidenBusqueda(Producto producto, String termino) {

        return contiene(producto.getCodigo(), termino)
                || contiene(producto.getNombre(), termino)
                || contiene(producto.getDescripcion(), termino)
                || contiene(
                        producto.getCategoria().getNombre(),
                        termino
                )
                || producto.getMarca() != null
                        && contiene(producto.getMarca().getNombre(), termino);
    }

    private boolean contiene(String valor, String termino) {

        return valor != null && valor.toLowerCase(Locale.ROOT)
                .contains(termino);
    }

    @Override
    @Transactional
    public ProductoResponse actualizar(
            UUID id,
            ProductoRequest request
    ) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id
                        )
                );

        Categoria categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: "
                                        + request.categoriaId()
                        )
                );

        Marca marca = null;

        if (request.marcaId() != null) {
            marca = marcaRepository.findById(request.marcaId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Marca no encontrada con id: "
                                            + request.marcaId()
                            )
                    );
        }

        UnidadMedida unidadMedida = unidadMedidaRepository
                .findById(request.unidadMedidaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidad de medida no encontrada con id: "
                                        + request.unidadMedidaId()
                        )
                );

        Boolean activoActual = producto.getActivo();

        productoMapper.updateEntity(request, producto);

        if (request.activo() == null) {
            producto.setActivo(activoActual);
        }

        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setUnidadMedida(unidadMedida);

        producto.setFechaActualizacion(OffsetDateTime.now());

        Producto productoActualizado = productoRepository.save(producto);

        return productoMapper.toResponse(productoActualizado);
    }

    @Override
    @Transactional
    public ProductoResponse toggleActivo(UUID id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id
                        )
                );

        producto.setActivo(!Boolean.TRUE.equals(producto.getActivo()));

        producto.setFechaActualizacion(OffsetDateTime.now());

        return productoMapper.toResponse(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public void eliminar(UUID id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id
                        )
                );

        productoRepository.delete(producto);
    }
}