package com.servillantas.servicios.config;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.servillantas.servicios.domain.TipoServicio;
import com.servillantas.servicios.repository.TipoServicioRepository;

@Configuration
public class ServiciosDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(ServiciosDataInitializer.class);

    private final TipoServicioRepository tipoServicioRepository;

    public ServiciosDataInitializer(TipoServicioRepository tipoServicioRepository) {
        this.tipoServicioRepository = tipoServicioRepository;
    }

    @Bean
    CommandLineRunner initTiposServicio() {
        return args -> {
            if (tipoServicioRepository.count() > 0) {
                return;
            }

            tipoServicioRepository.saveAll(List.of(
                new TipoServicio(UUID.randomUUID(), "Alineación y Balanceo 3D", "Alineación computarizada y plomos de precisión.", new BigDecimal("70.00"), true),
                new TipoServicio(UUID.randomUUID(), "Cambio de Aceite y Filtro", "Mano de obra para drenado y sustitución de lubricante y filtro.", new BigDecimal("45.00"), true),
                new TipoServicio(UUID.randomUUID(), "Vulcanización y Parchado", "Parchado técnico en frío/caliente de neumáticos perforados.", new BigDecimal("25.00"), true),
                new TipoServicio(UUID.randomUUID(), "Mantenimiento de Frenos", "Limpieza, calibración y engrasado de zapatas o pastillas.", new BigDecimal("60.00"), true),
                new TipoServicio(UUID.randomUUID(), "Rotación e Inspección", "Rotación en X de 4 neumáticos y verificación de presión.", new BigDecimal("30.00"), true)
            ));

            log.info("Tipos de servicio demo inicializados en ms-servicios.");
        };
    }
}
