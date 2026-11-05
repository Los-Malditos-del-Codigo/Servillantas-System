package com.servillantas.compras.service;

import com.servillantas.compras.domain.Proveedor;
import com.servillantas.compras.dto.CrearProveedorRequestDto;
import com.servillantas.compras.dto.PageResponseDto;
import com.servillantas.compras.dto.ProveedorDto;
import com.servillantas.compras.exception.DuplicadoException;
import com.servillantas.compras.exception.RecursoNoEncontradoException;
import com.servillantas.compras.exception.ValidacionException;
import com.servillantas.compras.repository.ProveedorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProveedoresService {

    private final ProveedorRepository proveedorRepository;

    public ProveedoresService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    /**
     * HU-14: Registrar proveedores
     */
    @Transactional
    public ProveedorDto crearProveedor(CrearProveedorRequestDto dto) {
        if (dto.nombre() == null || dto.nombre().trim().isEmpty()) {
            throw new ValidacionException("El nombre del proveedor es obligatorio");
        }

        String rucTrimmed = null;
        if (dto.ruc() != null && !dto.ruc().trim().isEmpty()) {
            rucTrimmed = dto.ruc().trim();
            if (!rucTrimmed.matches("^[0-9]{11}$")) {
                throw new ValidacionException("El RUC debe tener exactamente 11 dígitos numéricos");
            }
            if (proveedorRepository.existsByRuc(rucTrimmed)) {
                throw new DuplicadoException("Ya existe un proveedor registrado con el RUC: " + rucTrimmed);
            }
        }

        String emailTrimmed = dto.email() != null && !dto.email().trim().isEmpty() ? dto.email().trim() : null;
        String telefonoTrimmed = dto.telefono() != null && !dto.telefono().trim().isEmpty() ? dto.telefono().trim() : null;
        String direccionTrimmed = dto.direccion() != null && !dto.direccion().trim().isEmpty() ? dto.direccion().trim() : null;

        Proveedor proveedor = new Proveedor(
                UUID.randomUUID(),
                dto.nombre().trim(),
                rucTrimmed,
                telefonoTrimmed,
                emailTrimmed,
                direccionTrimmed,
                true
        );

        Proveedor guardado = proveedorRepository.save(proveedor);
        return toDto(guardado);
    }

    /**
     * HU-15: Listar y buscar proveedores
     */
    @Transactional(readOnly = true)
    public PageResponseDto<ProveedorDto> listarProveedores(String busqueda, Boolean activo, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 100);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.ASC, "nombre");
        Pageable paginaAjustada = PageRequest.of(pageable.getPageNumber(), pageSize, sort);

        String filtroBusqueda = (busqueda != null && !busqueda.trim().isEmpty()) ? busqueda.trim() : null;
        Page<Proveedor> pagina = proveedorRepository.findByFiltros(filtroBusqueda, activo, paginaAjustada);

        Page<ProveedorDto> paginaDto = pagina.map(this::toDto);
        return PageResponseDto.from(paginaDto);
    }

    @Transactional(readOnly = true)
    public ProveedorDto obtenerPorId(UUID id) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor no encontrado con ID: " + id));
        return toDto(proveedor);
    }

    /**
     * HU-14 (edición): actualizar los datos de un proveedor existente.
     */
    @Transactional
    public ProveedorDto actualizarProveedor(UUID id, CrearProveedorRequestDto dto) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor no encontrado con ID: " + id));

        if (dto.nombre() == null || dto.nombre().trim().isEmpty()) {
            throw new ValidacionException("El nombre del proveedor es obligatorio");
        }

        String rucTrimmed = null;
        if (dto.ruc() != null && !dto.ruc().trim().isEmpty()) {
            rucTrimmed = dto.ruc().trim();
            if (!rucTrimmed.matches("^[0-9]{11}$")) {
                throw new ValidacionException("El RUC debe tener exactamente 11 dígitos numéricos");
            }
            Proveedor conMismoRuc = proveedorRepository.findByRuc(rucTrimmed).orElse(null);
            if (conMismoRuc != null && !conMismoRuc.getId().equals(id)) {
                throw new DuplicadoException("Ya existe un proveedor registrado con el RUC: " + rucTrimmed);
            }
        }

        proveedor.setNombre(dto.nombre().trim());
        proveedor.setRuc(rucTrimmed);
        proveedor.setTelefono(dto.telefono() != null && !dto.telefono().trim().isEmpty() ? dto.telefono().trim() : null);
        proveedor.setEmail(dto.email() != null && !dto.email().trim().isEmpty() ? dto.email().trim() : null);
        proveedor.setDireccion(dto.direccion() != null && !dto.direccion().trim().isEmpty() ? dto.direccion().trim() : null);

        Proveedor guardado = proveedorRepository.save(proveedor);
        return toDto(guardado);
    }

    /**
     * HU-15: activar o desactivar un proveedor del directorio.
     */
    @Transactional
    public ProveedorDto cambiarEstado(UUID id, boolean activo) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Proveedor no encontrado con ID: " + id));
        proveedor.setActivo(activo);
        return toDto(proveedorRepository.save(proveedor));
    }

    // Conversión explícita entre Entidad y DTO (sin mappers externos)
    private ProveedorDto toDto(Proveedor p) {
        return new ProveedorDto(
                p.getId(),
                p.getNombre(),
                p.getRuc(),
                p.getTelefono(),
                p.getEmail(),
                p.getDireccion(),
                p.getActivo(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
