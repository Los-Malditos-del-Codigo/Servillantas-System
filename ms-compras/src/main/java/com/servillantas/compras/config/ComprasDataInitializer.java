package com.servillantas.compras.config;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.servillantas.compras.domain.Proveedor;
import com.servillantas.compras.repository.ProveedorRepository;

@Configuration
public class ComprasDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(ComprasDataInitializer.class);

    private final ProveedorRepository proveedorRepository;

    public ComprasDataInitializer(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    @Bean
    CommandLineRunner initProveedores() {
        return args -> {
            if (proveedorRepository.count() > 0) {
                return;
            }

            proveedorRepository.saveAll(List.of(
                new Proveedor(UUID.randomUUID(), "Distribuidora de Neumáticos del Pacífico S.A.C.", "20512345678", "014234567", "ventas@neumaticospacifico.pe", "Av. Argentina 1234, Lima", true),
                new Proveedor(UUID.randomUUID(), "Lubricantes y Filtros Industriales E.I.R.L.", "20601234567", "015345678", "contacto@lubrifiltros.pe", "Av. Colonial 567, Callao", true),
                new Proveedor(UUID.randomUUID(), "Baterías y Repuestos Automotrices del Perú S.A.", "20109876543", "016456789", "atencion@bateriasperu.pe", "Av. La Marina 890, San Miguel", true)
            ));

            log.info("Proveedores demo inicializados en ms-compras.");
        };
    }
}
