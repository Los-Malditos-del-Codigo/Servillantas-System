package com.servillantas.producto.config;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.servillantas.producto.entity.Categoria;
import com.servillantas.producto.entity.Marca;
import com.servillantas.producto.entity.Producto;
import com.servillantas.producto.entity.UnidadMedida;
import com.servillantas.producto.repository.CategoriaRepository;
import com.servillantas.producto.repository.MarcaRepository;
import com.servillantas.producto.repository.ProductoRepository;
import com.servillantas.producto.repository.UnidadMedidaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

	private final CategoriaRepository categoriaRepository;
	private final MarcaRepository marcaRepository;
	private final UnidadMedidaRepository unidadMedidaRepository;
	private final ProductoRepository productoRepository;

	@Bean
	CommandLineRunner initProductosData() {
		return args -> {
			seedUnidades();
			seedCategorias();
			seedMarcas();
			seedProductos();
		};
	}

	private void seedUnidades() {
		if (unidadMedidaRepository.count() > 0) {
			return;
		}

		unidadMedidaRepository.saveAll(List.of(
				buildUnidad("Unidad", "UND"),
				buildUnidad("Litro", "L"),
				buildUnidad("Kilogramo", "KG"),
				buildUnidad("Metro", "M"),
				buildUnidad("Juego", "JGO")));

		log.info("Unidades de medida inicializadas.");
	}

	private void seedCategorias() {
		if (categoriaRepository.count() > 0) {
			return;
		}

		categoriaRepository.saveAll(List.of(
				buildCategoria("Llantas y Neumáticos",
						"Neumáticos radiales para autos, camionetas y SUVs."),
				buildCategoria("Lubricantes y Fluidos",
						"Aceites, líquido de frenos y refrigerantes."),
				buildCategoria("Baterías y Energía",
						"Baterías automotrices selladas."),
				buildCategoria("Aros y Rines",
						"Aros de aleación y acero."),
				buildCategoria("Accesorios y Vulcanización",
						"Válvulas, plomos y consumibles de taller.")));

		log.info("Categorías inicializadas.");
	}

	private void seedMarcas() {
		if (marcaRepository.count() > 0) {
			return;
		}

		marcaRepository.saveAll(List.of(
				buildMarca("Michelin", "Marca líder en durabilidad y seguridad en rodaje"),
				buildMarca("Goodyear", "Neumáticos de alto rendimiento y agarre en mojado"),
				buildMarca("Bridgestone", "Tecnología japonesa de precisión y eficiencia de combustible"),
				buildMarca("Castrol", "Lubricantes para motores de alta exigencia térmica"),
				buildMarca("Bosch", "Equipos eléctricos, baterías y componentes de precisión alemana"),
				buildMarca("Etna", "Baterías automotrices peruanas de alto arranque en frío")));

		log.info("Marcas inicializadas.");
	}

	private void seedProductos() {
		if (productoRepository.count() > 0) {
			return;
		}

		Categoria llantas = findCategoria("Llantas y Neumáticos");
		Categoria lubricantes = findCategoria("Lubricantes y Fluidos");
		Categoria baterias = findCategoria("Baterías y Energía");

		Marca michelin = findMarca("Michelin");
		Marca castrol = findMarca("Castrol");
		Marca bosch = findMarca("Bosch");

		UnidadMedida unidad = findUnidad("Unidad");
		UnidadMedida litro = findUnidad("Litro");

		if (llantas == null || lubricantes == null || baterias == null
				|| unidad == null || litro == null) {
			log.warn("No se pudieron crear productos demo: faltan catálogos base.");
			return;
		}

		productoRepository.saveAll(List.of(
				buildProducto("LL-1856515-MICH",
						"Llanta Michelin Energy XM2+ 185/65 R15",
						"Neumático radial de alto rendimiento para uso mixto.",
						llantas, michelin, unidad, "389.90", "4"),
				buildProducto("LU-15W40-CAST",
						"Aceite Castrol GTX 15W-40 (1 galón)",
						"Aceite mineral para motores a gasolina y diésel.",
						lubricantes, castrol, litro, "89.50", "6"),
				buildProducto("BA-13PL-BOSCH",
						"Batería Bosch S4 13 placas",
						"Batería libre de mantenimiento de 13 placas.",
						baterias, bosch, unidad, "459.00", "2")));

		log.info("Productos inicializados.");
	}

	private Categoria findCategoria(String nombre) {
		return categoriaRepository.findAll().stream()
				.filter(c -> c.getNombre().equalsIgnoreCase(nombre))
				.findFirst().orElse(null);
	}

	private Marca findMarca(String nombre) {
		return marcaRepository.findAll().stream()
				.filter(m -> m.getNombre().equalsIgnoreCase(nombre))
				.findFirst().orElse(null);
	}

	private UnidadMedida findUnidad(String nombre) {
		return unidadMedidaRepository.findAll().stream()
				.filter(u -> u.getNombre().equalsIgnoreCase(nombre))
				.findFirst().orElse(null);
	}

	private UnidadMedida buildUnidad(String nombre, String abreviatura) {
		OffsetDateTime ahora = OffsetDateTime.now();
		return UnidadMedida.builder()
				.nombre(nombre)
				.abreviatura(abreviatura)
				.activo(true)
				.createdAt(ahora)
				.updatedAt(ahora)
				.build();
	}

	private Categoria buildCategoria(String nombre, String descripcion) {
		OffsetDateTime ahora = OffsetDateTime.now();
		return Categoria.builder()
				.nombre(nombre)
				.descripcion(descripcion)
				.activo(true)
				.createdAt(ahora)
				.updatedAt(ahora)
				.build();
	}

	private Marca buildMarca(String nombre, String descripcion) {
		OffsetDateTime ahora = OffsetDateTime.now();
		return Marca.builder()
				.nombre(nombre)
				.descripcion(descripcion)
				.activo(true)
				.createdAt(ahora)
				.updatedAt(ahora)
				.build();
	}

	private Producto buildProducto(String codigo, String nombre, String descripcion,
			Categoria categoria, Marca marca, UnidadMedida unidad, String precio, String stockMinimo) {
		OffsetDateTime ahora = OffsetDateTime.now();
		return Producto.builder()
				.codigo(codigo)
				.nombre(nombre)
				.descripcion(descripcion)
				.categoria(categoria)
				.marca(marca)
				.unidadMedida(unidad)
				.precioVenta(new BigDecimal(precio))
				.stockMinimo(new BigDecimal(stockMinimo))
				.activo(true)
				.fechaCreacion(ahora)
				.fechaActualizacion(ahora)
				.build();
	}
}
