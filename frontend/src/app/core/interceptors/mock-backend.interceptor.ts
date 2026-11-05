import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { timer, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MockDbService } from '../services/mock-db.service';

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMocks || !req.url.includes(environment.apiUrl)) {
    return next(req);
  }

  const mockDb = inject(MockDbService);
  const randomDelay =
    Math.floor(Math.random() * (environment.mockDelayMax - environment.mockDelayMin + 1)) +
    environment.mockDelayMin;

  const url = req.url;
  const path = url.split('?')[0];
  const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const method = req.method.toUpperCase();
  const body = (req.body || {}) as any;

  // Helper response builders
  const ok = (responseBody: any) =>
    timer(randomDelay).pipe(switchMap(() => of(new HttpResponse({ status: 200, body: responseBody }))));

  const created = (responseBody: any) =>
    timer(randomDelay).pipe(switchMap(() => of(new HttpResponse({ status: 201, body: responseBody }))));

  const badRequest = (mensaje: string) =>
    timer(randomDelay).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              statusText: 'Bad Request',
              error: { mensaje },
            })
        )
      )
    );

  const unauthorized = (mensaje = 'Credenciales inválidas') =>
    timer(randomDelay).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              error: { mensaje },
            })
        )
      )
    );

  const notFound = (mensaje = 'Recurso no encontrado') =>
    timer(randomDelay).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
              error: { mensaje },
            })
        )
      )
    );

  try {
    // Auth
    if (path.endsWith('/auth/login') && method === 'POST') {
      const { correo, password } = body;
      const sesion = mockDb.authenticate(correo, password);
      if (!sesion) {
        return unauthorized('Credenciales incorrectas. Verifique su correo y contraseña.');
      }
      return ok(sesion);
    }

    if (path === `${environment.apiUrl}/proveedores`) {
      if (method === 'GET') return ok(mockDb.getProveedores());
      if (method === 'POST') return created(mockDb.createProveedor(body));
    }

    const proveedorMatch = path.match(new RegExp(`^${environment.apiUrl}/proveedores/([^/]+)$`));
    if (proveedorMatch && method === 'PUT') {
      return ok(mockDb.updateProveedor(proveedorMatch[1], body));
    }

    if (path === `${environment.apiUrl}/compras`) {
      if (method === 'GET') return ok(mockDb.getCompras());
      if (method === 'POST') return created(mockDb.createCompra(body));
    }

    const compraReceiveMatch = path.match(new RegExp(`^${environment.apiUrl}/compras/([^/]+)/recibir$`));
    if (compraReceiveMatch && method === 'POST') {
      return ok(mockDb.receiveCompra(compraReceiveMatch[1], 'Usuario de prueba'));
    }

    const compraCancelMatch = path.match(new RegExp(`^${environment.apiUrl}/compras/([^/]+)/anular$`));
    if (compraCancelMatch && method === 'POST') {
      return ok(mockDb.cancelCompra(compraCancelMatch[1], body.motivo ?? 'Anulada por el usuario'));
    }

    const compraMatch = path.match(new RegExp(`^${environment.apiUrl}/compras/([^/]+)$`));
    if (compraMatch && method === 'GET') {
      const compra = mockDb.getCompra(compraMatch[1]);
      return compra ? ok(compra) : notFound('Compra no encontrada.');
    }

    if (path === `${environment.apiUrl}/ventas`) {
      if (method === 'GET') return ok(mockDb.getVentas());
      if (method === 'POST') {
        const sesionRaw = localStorage.getItem('srv_sesion_activa');
        const currentUser = sesionRaw ? JSON.parse(sesionRaw)?.perfil : null;
        const userName = currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Usuario del Sistema';
        return created(mockDb.createVenta({ ...body, registrado_por: userName }));
      }
    }

    if (path === `${environment.apiUrl}/servicios-taller`) {
      if (method === 'GET') return ok(mockDb.getServiciosTaller());
      if (method === 'POST') {
        const sesionRaw = localStorage.getItem('srv_sesion_activa');
        const currentUser = sesionRaw ? JSON.parse(sesionRaw)?.perfil : null;
        const userName = currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Usuario del Sistema';
        return created(mockDb.createServicioTaller({ ...body, registrado_por: userName }));
      }
    }

    const servicioEstadoMatch = path.match(new RegExp(`^${environment.apiUrl}/servicios-taller/([^/]+)/estado$`));
    if (servicioEstadoMatch && method === 'PATCH') {
      return ok(mockDb.updateServicioTallerEstado(servicioEstadoMatch[1], body.estado));
    }

    if (path === `${environment.apiUrl}/dashboard/resumen` && method === 'GET') {
      return ok(mockDb.getResumenDashboard());
    }

    // Categorias
    if (path === `${environment.apiUrl}/categorias`) {
      if (method === 'GET') {
        return ok(mockDb.getCategorias());
      }
      if (method === 'POST') {
        const item = mockDb.createCategoria(body);
        return created(item);
      }
    }

    const catMatch = path.match(new RegExp(`^${environment.apiUrl}/categorias/([^/]+)$`));
    if (catMatch) {
      const id = catMatch[1];
      if (method === 'GET') {
        const item = mockDb.getCategoriaById(id);
        return item ? ok(item) : notFound('Categoría no encontrada');
      }
      if (method === 'PUT') {
        const updated = mockDb.updateCategoria(id, body);
        return ok(updated);
      }
    }

    const catToggleMatch = path.match(new RegExp(`^${environment.apiUrl}/categorias/([^/]+)/activo$`));
    if (catToggleMatch && method === 'PATCH') {
      const id = catToggleMatch[1];
      const cat = mockDb.getCategoriaById(id);
      if (!cat) return notFound('Categoría no encontrada');
      const updated = mockDb.updateCategoria(id, { activo: !cat.activo });
      return ok(updated);
    }

    // Marcas
    if (path === `${environment.apiUrl}/marcas`) {
      if (method === 'GET') {
        return ok(mockDb.getMarcas());
      }
      if (method === 'POST') {
        const item = mockDb.createMarca(body);
        return created(item);
      }
    }

    const marcaMatch = path.match(new RegExp(`^${environment.apiUrl}/marcas/([^/]+)$`));
    if (marcaMatch) {
      const id = marcaMatch[1];
      if (method === 'GET') {
        const item = mockDb.getMarcaById(id);
        return item ? ok(item) : notFound('Marca no encontrada');
      }
      if (method === 'PUT') {
        const updated = mockDb.updateMarca(id, body);
        return ok(updated);
      }
    }

    const marcaToggleMatch = path.match(new RegExp(`^${environment.apiUrl}/marcas/([^/]+)/activo$`));
    if (marcaToggleMatch && method === 'PATCH') {
      const id = marcaToggleMatch[1];
      const m = mockDb.getMarcaById(id);
      if (!m) return notFound('Marca no encontrada');
      const updated = mockDb.updateMarca(id, { activo: !m.activo });
      return ok(updated);
    }

    // Unidades de medida
    if (path === `${environment.apiUrl}/unidades-medida`) {
      if (method === 'GET') {
        return ok(mockDb.getUnidades());
      }
      if (method === 'POST') {
        const item = mockDb.createUnidad(body);
        return created(item);
      }
    }

    const umMatch = path.match(new RegExp(`^${environment.apiUrl}/unidades-medida/([^/]+)$`));
    if (umMatch) {
      const id = umMatch[1];
      if (method === 'GET') {
        const item = mockDb.getUnidadById(id);
        return item ? ok(item) : notFound('Unidad de medida no encontrada');
      }
      if (method === 'PUT') {
        const updated = mockDb.updateUnidad(id, body);
        return ok(updated);
      }
    }

    const umToggleMatch = path.match(new RegExp(`^${environment.apiUrl}/unidades-medida/([^/]+)/activo$`));
    if (umToggleMatch && method === 'PATCH') {
      const id = umToggleMatch[1];
      const u = mockDb.getUnidadById(id);
      if (!u) return notFound('Unidad no encontrada');
      const updated = mockDb.updateUnidad(id, { activo: !u.activo });
      return ok(updated);
    }

    // Productos
    if (path === `${environment.apiUrl}/productos`) {
      if (method === 'GET') {
        const search = searchParams.get('search') || undefined;
        const categoriaId = searchParams.get('categoria_id') || undefined;
        const marcaId = searchParams.get('marca_id') || undefined;
        const includeInactivos = searchParams.get('include_inactivos') === 'true';

        const list = mockDb.getProductos({
          search,
          categoriaId,
          marcaId,
          includeInactivos,
        });
        return ok(list);
      }

      if (method === 'POST') {
        const item = mockDb.createProducto(body);
        return created(item);
      }
    }

    const prodToggleMatch = path.match(new RegExp(`^${environment.apiUrl}/productos/([^/]+)/activo$`));
    if (prodToggleMatch && method === 'PATCH') {
      const id = prodToggleMatch[1];
      const updated = mockDb.toggleProductoActivo(id);
      return ok(updated);
    }

    const prodMatch = path.match(new RegExp(`^${environment.apiUrl}/productos/([^/]+)$`));
    if (prodMatch) {
      const id = prodMatch[1];
      if (method === 'GET') {
        const item = mockDb.getProductoById(id);
        return item ? ok(item) : notFound('Producto no encontrado');
      }
      if (method === 'PUT') {
        const updated = mockDb.updateProducto(id, body);
        return ok(updated);
      }
    }

    // Inventario y movimientos
    if (path === `${environment.apiUrl}/inventario/stock` && method === 'GET') {
      return ok(mockDb.getInventarios());
    }

    const stockItemMatch = path.match(new RegExp(`^${environment.apiUrl}/inventario/stock/([^/]+)$`));
    if (stockItemMatch && method === 'GET') {
      const productoId = stockItemMatch[1];
      const item = mockDb.getInventarioByProductoId(productoId);
      return item ? ok(item) : ok({ id: '', producto_id: productoId, stock_actual: 0 });
    }

    if (path === `${environment.apiUrl}/inventario/entradas` && method === 'POST') {
      const sesionRaw = localStorage.getItem('srv_sesion_activa');
      const currentUser = sesionRaw ? JSON.parse(sesionRaw)?.perfil : null;
      const userName = currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Usuario del Sistema';

      const res = mockDb.registrarEntrada(body, userName);
      return created(res);
    }

    if (path === `${environment.apiUrl}/inventario/salidas` && method === 'POST') {
      const sesionRaw = localStorage.getItem('srv_sesion_activa');
      const currentUser = sesionRaw ? JSON.parse(sesionRaw)?.perfil : null;
      const userName = currentUser ? `${currentUser.nombres} ${currentUser.apellidos}` : 'Usuario del Sistema';

      const res = mockDb.registrarSalida(body, userName);
      return created(res);
    }

    if (path === `${environment.apiUrl}/inventario/movimientos` && method === 'GET') {
      const productoId = searchParams.get('producto_id') || undefined;
      const tipo = (searchParams.get('tipo') as any) || undefined;
      const fechaDesde = searchParams.get('fecha_desde') || undefined;
      const fechaHasta = searchParams.get('fecha_hasta') || undefined;

      const list = mockDb.getMovimientos({
        productoId,
        tipo,
        fechaDesde,
        fechaHasta,
      });
      return ok(list);
    }

    // Alertas
    if (path === `${environment.apiUrl}/alertas` && method === 'GET') {
      return ok(mockDb.getAlertas());
    }

    const alertaEstadoMatch = path.match(new RegExp(`^${environment.apiUrl}/alertas/([^/]+)/estado$`));
    if (alertaEstadoMatch && method === 'PATCH') {
      const id = alertaEstadoMatch[1];
      const { estado } = body;
      const updated = mockDb.updateAlertaEstado(id, estado);
      return ok(updated);
    }

    // Default: si no coincide con ruta mock conocida
    return notFound(`Ruta no implementada en mock: ${method} ${path}`);
  } catch (err: any) {
    return badRequest(err.message || 'Error en el servidor simulado');
  }
};
