import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { ExcelExportService } from './excel-export.service';

describe('ExcelExportService', () => {
  it('creates a valid workbook with escaped text and numeric cells', () => {
    const service = new ExcelExportService();
    const workbook = service.crearLibro('Ventas', [
      ['Cliente', 'Total PEN', 'Cantidad'],
      ['A&B < Taller', 125.5, 2],
    ], 'Reporte de ventas');
    const files = unzipSync(workbook);
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
    const workbookXml = strFromU8(files['xl/workbook.xml']);
    const styles = strFromU8(files['xl/styles.xml']);

    expect(workbookXml).toContain('name="Ventas"');
    expect(sheet).toContain('Reporte de ventas');
    expect(sheet).toContain('A&amp;B &lt; Taller');
    expect(sheet).toContain('<c r="B6" s="7" t="n"><v>125.5</v></c>');
    expect(sheet).toContain('<c r="C6" s="9" t="n"><v>2</v></c>');
    expect(sheet).toContain('autoFilter ref="A5:C6"');
    expect(sheet).toContain('ySplit="5"');
    expect(styles).toContain('FF2E5A6C');
  });

  it('rejects empty spreadsheet data', () => {
    const service = new ExcelExportService();

    expect(() => service.crearLibro('Ventas', [])).toThrow('No hay datos para exportar a Excel.');
  });
});
