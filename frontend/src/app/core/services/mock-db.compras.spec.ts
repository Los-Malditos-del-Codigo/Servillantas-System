// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { MockDbService } from './mock-db.service';

describe('MockDbService purchases', () => {
  let db: MockDbService;

  beforeEach(() => {
    localStorage.clear();
    db = new MockDbService();
  });

  it('creates a pending order and adds its quantities to stock only when received', () => {
    const stockBefore = db.getInventarioByProductoId('prod-01')!.stock_actual;
    const compra = db.createCompra({
      proveedor_id: 'prov-1',
      fecha: '2026-11-03',
      detalles: [{ producto_id: 'prod-01', cantidad: 3, costo_unitario: 125, subtotal: 375 }],
    });

    expect(compra.estado).toBe('pendiente');
    expect(compra.total).toBe(375);
    expect(db.getInventarioByProductoId('prod-01')!.stock_actual).toBe(stockBefore);

    const recibida = db.receiveCompra(compra.id, 'Roberto Vargas');

    expect(recibida.estado).toBe('recibida');
    expect(db.getInventarioByProductoId('prod-01')!.stock_actual).toBe(stockBefore + 3);
    expect(db.getMovimientos({ productoId: 'prod-01' })[0].motivo).toBe('Compra');
    expect(() => db.receiveCompra(compra.id, 'Roberto Vargas')).toThrow('Solo se pueden recibir compras pendientes.');
  });

  it('does not change stock when a pending order is cancelled', () => {
    const stockBefore = db.getInventarioByProductoId('prod-02')!.stock_actual;
    const compra = db.createCompra({
      proveedor_id: 'prov-1',
      fecha: '2026-11-03',
      detalles: [{ producto_id: 'prod-02', cantidad: 2, costo_unitario: 210, subtotal: 420 }],
    });

    const anulada = db.cancelCompra(compra.id, 'Pedido duplicado');

    expect(anulada.estado).toBe('anulada');
    expect(anulada.motivo_anulacion).toBe('Pedido duplicado');
    expect(db.getInventarioByProductoId('prod-02')!.stock_actual).toBe(stockBefore);
    expect(() => db.cancelCompra(compra.id, 'Otra razón')).toThrow('Solo se pueden anular compras pendientes.');
  });

  it('rejects duplicate supplier RUCs and malformed order lines', () => {
    expect(() => db.createProveedor({ ruc: '20123456789', razon_social: 'Duplicado' }))
      .toThrow('Ya existe un proveedor con ese RUC.');
    expect(() => db.createCompra({
      proveedor_id: 'prov-1',
      fecha: '2026-11-03',
      detalles: [{ producto_id: 'prod-01', cantidad: 0, costo_unitario: 125, subtotal: 0 }],
    })).toThrow('Revisa las cantidades y costos de los productos.');
  });

  it('records a sale and deducts its products from stock', () => {
    const stockBefore = db.getInventarioByProductoId('prod-01')!.stock_actual;
    const venta = db.createVenta({
      cliente: 'Cliente de prueba',
      medio_pago: 'efectivo',
      detalles: [{ producto_id: 'prod-01', cantidad: 2 }],
    });

    expect(venta.total).toBe(680);
    expect(db.getInventarioByProductoId('prod-01')!.stock_actual).toBe(stockBefore - 2);
    expect(db.getMovimientos({ productoId: 'prod-01' })[0].motivo).toBe('Venta');
    expect(() => db.createVenta({
      cliente: 'Sin stock',
      medio_pago: 'efectivo',
      detalles: [{ producto_id: 'prod-01', cantidad: 999 }],
    })).toThrow('Stock insuficiente');
  });

  it('consumes workshop materials and restores them if the service is cancelled', () => {
    const stockBefore = db.getInventarioByProductoId('prod-01')!.stock_actual;
    const servicio = db.createServicioTaller({
      cliente: 'Cliente de taller',
      placa: 'ABC-123',
      vehiculo: 'Auto de prueba',
      descripcion: 'Cambio de neumáticos',
      mano_obra: 80,
      materiales: [{ producto_id: 'prod-01', cantidad: 1 }],
    });

    expect(servicio.total).toBe(420);
    expect(db.getInventarioByProductoId('prod-01')!.stock_actual).toBe(stockBefore - 1);
    expect(db.updateServicioTallerEstado(servicio.id, 'cancelado').estado).toBe('cancelado');
    expect(db.getInventarioByProductoId('prod-01')!.stock_actual).toBe(stockBefore);
    expect(() => db.updateServicioTallerEstado(servicio.id, 'completado')).toThrow('Solo se puede actualizar un servicio en proceso.');
  });
});
