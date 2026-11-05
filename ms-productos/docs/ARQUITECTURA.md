# Estructura del Microservicio Product Service

```text
product-service/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── yanfranko/
│   │   │           └── product/
│   │   │               │
│   │   │               ├── ProductServiceApplication.java
│   │   │               │
│   │   │               ├── controller/
│   │   │               │   ├── ProductoController.java
│   │   │               │   ├── CategoriaController.java
│   │   │               │   ├── MarcaController.java
│   │   │               │   └── UnidadMedidaController.java
│   │   │               │
│   │   │               ├── service/
│   │   │               │   ├── ProductoService.java
│   │   │               │   ├── CategoriaService.java
│   │   │               │   ├── MarcaService.java
│   │   │               │   └── UnidadMedidaService.java
│   │   │               │
│   │   │               ├── service/
│   │   │               │   └── impl/
│   │   │               │       ├── ProductoServiceImpl.java
│   │   │               │       ├── CategoriaServiceImpl.java
│   │   │               │       ├── MarcaServiceImpl.java
│   │   │               │       └── UnidadMedidaServiceImpl.java
│   │   │               │
│   │   │               ├── repository/
│   │   │               │   ├── ProductoRepository.java
│   │   │               │   ├── CategoriaRepository.java
│   │   │               │   ├── MarcaRepository.java
│   │   │               │   └── UnidadMedidaRepository.java
│   │   │               │
│   │   │               ├── entity/
│   │   │               │   ├── Producto.java
│   │   │               │   ├── Categoria.java
│   │   │               │   ├── Marca.java
│   │   │               │   └── UnidadMedida.java
│   │   │               │
│   │   │               ├── dto/
│   │   │               │   ├── producto/
│   │   │               │   │   ├── ProductoRequest.java
│   │   │               │   │   └── ProductoResponse.java
│   │   │               │   │
│   │   │               │   ├── categoria/
│   │   │               │   │   ├── CategoriaRequest.java
│   │   │               │   │   └── CategoriaResponse.java
│   │   │               │   │
│   │   │               │   ├── marca/
│   │   │               │   │   ├── MarcaRequest.java
│   │   │               │   │   └── MarcaResponse.java
│   │   │               │   │
│   │   │               │   └── unidadmedida/
│   │   │               │       ├── UnidadMedidaRequest.java
│   │   │               │       └── UnidadMedidaResponse.java
│   │   │               │
│   │   │               ├── mapper/
│   │   │               │   ├── ProductoMapper.java
│   │   │               │   ├── CategoriaMapper.java
│   │   │               │   ├── MarcaMapper.java
│   │   │               │   └── UnidadMedidaMapper.java
│   │   │               │
│   │   │               ├── exception/
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   ├── BusinessException.java
│   │   │               │   └── GlobalExceptionHandler.java
│   │   │               │
│   │   │               └── config/
│   │   │                   └── ...
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── yanfranko/
│                   └── product/
│                       ├── controller/
│                       ├── service/
│                       ├── repository/
│                       └── integration/
│
├── .gitignore
├── Dockerfile
├── compose.yml
├── pom.xml
└── README.md
```

## Descripción de las capas

### Controller

Contiene los endpoints REST del microservicio:

* `ProductoController`
* `CategoriaController`
* `MarcaController`
* `UnidadMedidaController`

### Service

Contiene las interfaces que definen la lógica de negocio:

* `ProductoService`
* `CategoriaService`
* `MarcaService`
* `UnidadMedidaService`

### Service Impl

Contiene las implementaciones de las interfaces de servicio:

* `ProductoServiceImpl`
* `CategoriaServiceImpl`
* `MarcaServiceImpl`
* `UnidadMedidaServiceImpl`

### Repository

Responsable del acceso a PostgreSQL mediante Spring Data JPA:

* `ProductoRepository`
* `CategoriaRepository`
* `MarcaRepository`
* `UnidadMedidaRepository`

### Entity

Representa las tablas de la base de datos:

* `Producto`
* `Categoria`
* `Marca`
* `UnidadMedida`

### DTO

Separa los objetos de entrada y salida de la API de las entidades JPA.

Cada dominio tiene:

* `Request`
* `Response`

### Mapper

Responsable de transformar:

```text
Request  → Entity
Entity   → Response
```

### Exception

Centraliza el manejo de errores:

* `ResourceNotFoundException`
* `BusinessException`
* `GlobalExceptionHandler`

### Config

Contendrá las configuraciones adicionales del microservicio.

### Test

Organiza las pruebas por capa:

```text
controller/
service/
repository/
integration/
```
