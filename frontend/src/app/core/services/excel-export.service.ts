import { Injectable } from '@angular/core';
import { strToU8, zipSync } from 'fflate';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  exportar(
    nombreHoja: string,
    nombreArchivo: string,
    rows: Array<Array<string | number>>,
    tituloReporte = nombreHoja
  ): void {
    const workbook = this.crearLibro(nombreHoja, rows, tituloReporte);
    const blob = new Blob([workbook], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  crearLibro(nombreHoja: string, rows: Array<Array<string | number>>, tituloReporte = nombreHoja): Uint8Array {
    if (!rows.length || !rows[0].length) {
      throw new Error('No hay datos para exportar a Excel.');
    }

    const columnCount = Math.max(...rows.map((row) => row.length));
    const lastColumn = this.excelColumn(columnCount);
    const reportRows: Array<{ values: Array<string | number>; style: number }> = [
      { values: [tituloReporte], style: 1 },
      { values: ['SERVILLANTAS RV  ·  REPORTE DE GESTIÓN'], style: 2 },
      { values: [`Generado el ${new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`], style: 3 },
      { values: [], style: 0 },
      { values: rows[0], style: 4 },
      ...rows.slice(1).map((row, index) => ({ values: row, style: index % 2 === 0 ? 5 : 6 })),
    ];

    const sheetRows = reportRows.map(({ values, style }, rowIndex) => {
      const excelRow = rowIndex + 1;
      const cells = values.map((value, columnIndex) => {
        const reference = `${this.excelColumn(columnIndex + 1)}${excelRow}`;
        if (typeof value === 'number' && Number.isFinite(value)) {
          const esEntero = /stock|cantidad/i.test(String(rows[0][columnIndex] ?? ''));
          const numberStyle = esEntero
            ? (style === 6 ? 10 : 9)
            : style === 5 ? 7 : style === 6 ? 8 : style;
          return `<c r="${reference}" s="${numberStyle}" t="n"><v>${value}</v></c>`;
        }
        return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${this.escapeXml(String(value))}</t></is></c>`;
      }).join('');
      const height = excelRow === 1 ? '30' : excelRow === 5 ? '24' : excelRow < 4 ? '21' : '20';
      return `<row r="${excelRow}" ht="${height}" customHeight="1">${cells}</row>`;
    }).join('');
    const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
      const heading = String(rows[0][columnIndex] ?? '');
      const longest = Math.max(heading.length, ...rows.slice(1).map((row) => String(row[columnIndex] ?? '').length));
      return `<col min="${columnIndex + 1}" max="${columnIndex + 1}" width="${Math.min(Math.max(longest + 3, 14), 48)}" customWidth="1"/>`;
    }).join('');
    const xmlFiles: Record<string, Uint8Array> = {
      '[Content_Types].xml': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'
      ),
      '_rels/.rels': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'
      ),
      'xl/workbook.xml': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${this.escapeXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
      ),
      'xl/_rels/workbook.xml.rels': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'
      ),
      'xl/styles.xml': strToU8(this.stylesXml()),
      'xl/worksheets/sheet1.xml': strToU8(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="20"/>' +
        `<cols>${widths}</cols><sheetData>${sheetRows}</sheetData>` +
        `<autoFilter ref="A5:${lastColumn}${reportRows.length}"/>` +
        `<mergeCells count="3"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/><mergeCell ref="A3:${lastColumn}3"/></mergeCells></worksheet>`
      ),
    };
    return zipSync(xmlFiles, { level: 6 });
  }

  private stylesXml(): string {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00;[Red]-#,##0.00"/><numFmt numFmtId="165" formatCode="#,##0;[Red]-#,##0"/></numFmts>' +
      '<fonts count="5">' +
      '<font><sz val="10"/><name val="Aptos"/><color rgb="FF1E2430"/></font>' +
      '<font><b/><sz val="16"/><name val="Aptos Display"/><color rgb="FFFFFFFF"/></font>' +
      '<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FF2E5A6C"/></font>' +
      '<font><sz val="9"/><name val="Aptos"/><color rgb="FF687681"/></font>' +
      '<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FF244857"/></font>' +
      '</fonts>' +
      '<fills count="5">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF2E5A6C"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEAF0F3"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF6F7F8"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="hair"><color rgb="FFE2E5E9"/></left><right style="hair"><color rgb="FFE2E5E9"/></right>' +
      '<top/><bottom style="hair"><color rgb="FFE2E5E9"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="11">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>';
  }

  private excelColumn(index: number): string {
    let result = '';
    while (index > 0) {
      index -= 1;
      result = String.fromCharCode(65 + index % 26) + result;
      index = Math.floor(index / 26);
    }
    return result;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
