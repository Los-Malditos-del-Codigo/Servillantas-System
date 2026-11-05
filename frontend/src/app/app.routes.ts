import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'productos',
      },
      // Módulo Inventario (Vista principal por defecto)
      {
        path: 'inventario',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/inventario/stock-panel/stock-panel.component').then(
                (m) => m.StockPanelComponent
              ),
          },
          {
            path: 'entrada',
            loadComponent: () =>
              import('./features/inventario/registrar-entrada/registrar-entrada.component').then(
                (m) => m.RegistrarEntradaComponent
              ),
          },
          {
            path: 'salida',
            loadComponent: () =>
              import('./features/inventario/registrar-salida/registrar-salida.component').then(
                (m) => m.RegistrarSalidaComponent
              ),
          },
          {
            path: 'movimientos',
            loadComponent: () =>
              import('./features/inventario/movimientos-historial/movimientos-historial.component').then(
                (m) => m.MovimientosHistorialComponent
              ),
          },
        ],
      },
      // Módulo Productos
      {
        path: 'productos',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/productos/productos-list/productos-list.component').then(
                (m) => m.ProductosListComponent
              ),
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/productos/producto-wizard/producto-wizard.component').then(
                (m) => m.ProductoWizardComponent
              ),
          },
          {
            path: 'catalogos',
            loadComponent: () =>
              import('./features/productos/catalogos-admin/catalogos-admin.component').then(
                (m) => m.CatalogosAdminComponent
              ),
          },
        ],
      },
      {
        path: 'compras',
        loadComponent: () =>
          import('./features/operaciones/compras.component').then((m) => m.ComprasComponent),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/operaciones/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'taller',
        loadComponent: () =>
          import('./features/operaciones/taller.component').then((m) => m.TallerComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('./features/alertas/alertas.component').then((m) => m.AlertasComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'productos',
  },
];
