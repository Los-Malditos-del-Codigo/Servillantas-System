// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoletaPrintService } from './boleta-print.service';

describe('BoletaPrintService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates a printable ticket and escapes customer-provided content', () => {
    const write = vi.fn();
    const printWindow = {
      document: { open: vi.fn(), write, close: vi.fn() },
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(printWindow);

    new BoletaPrintService().imprimir({
      codigo: 'V-001',
      fecha: '2026-11-03T10:00:00.000Z',
      cliente: '<Cliente & Prueba>',
      formaPago: 'Efectivo',
      lineas: [{ codigo: 'LL-01', descripcion: 'Llanta de prueba', unidad: 'UND', cantidad: 1, precio: 100 }],
      total: 100,
    });

    const html = write.mock.calls[0][0] as string;
    expect(html).toContain('BOLETA DE VENTA');
    expect(html).toContain('&lt;Cliente &amp; Prueba&gt;');
    expect(html).toContain('No es una boleta electrónica autorizada por SUNAT');
    expect(html).toContain('window.print()');
  });

  it('reports when the browser blocks the print window', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    expect(() => new BoletaPrintService().imprimir({
      codigo: 'V-001',
      fecha: new Date().toISOString(),
      cliente: 'Cliente',
      formaPago: 'Efectivo',
      lineas: [],
      total: 0,
    })).toThrow('El navegador bloqueó la ventana de impresión.');
  });
});
