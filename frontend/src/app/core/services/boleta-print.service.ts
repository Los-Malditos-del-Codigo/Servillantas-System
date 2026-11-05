import { Injectable } from '@angular/core';

export interface BoletaLinea {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio: number;
}

export interface BoletaData {
  codigo: string;
  fecha: string;
  cliente: string;
  documentoCliente?: string;
  telefono?: string;
  formaPago: string;
  observaciones?: string | null;
  lineas: BoletaLinea[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class BoletaPrintService {
  imprimir(data: BoletaData): void {
    const printWindow = window.open('', '_blank', 'width=440,height=760');
    if (!printWindow) {
      throw new Error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para imprimir la boleta.');
    }

    const subtotal = data.total / 1.18;
    const igv = data.total - subtotal;
    const amountWords = this.numeroEnLetras(data.total);
    const lines = data.lineas.map((linea) => `
      <tr>
        <td>${this.escape(linea.cantidad)} ${this.escape(linea.unidad)}</td>
        <td>${this.escape(linea.codigo)}</td>
        <td class="numeric">${this.money(linea.precio)}</td>
        <td class="numeric">${this.money(linea.cantidad * linea.precio)}</td>
      </tr>
      <tr><td class="description" colspan="4">${this.escape(linea.descripcion)}</td></tr>
    `).join('');
    const logoUrl = `${window.location.origin}/servillantaslogo.png`;
    const html = `<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Boleta ${this.escape(data.codigo)}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; }
            body { width: 72mm; margin: 0 auto; color: #111; font: 11px/1.35 Arial, sans-serif; }
            header { text-align: center; }
            .logo { display: block; width: 42mm; max-height: 22mm; object-fit: contain; margin: 0 auto 5px; }
            .business { font-weight: 700; }
            .muted { color: #555; }
            h1 { font-size: 15px; line-height: 1.2; margin: 14px 0 2px; }
            .center { text-align: center; }
            .document { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
            .customer { text-align: center; margin: 8px 0; }
            .meta { border-bottom: 1px solid #222; padding: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { text-align: left; border-bottom: 1px solid #222; padding: 4px 1px; }
            td { padding: 3px 1px; vertical-align: top; }
            .numeric { text-align: right; white-space: nowrap; }
            .description { padding-top: 0; overflow-wrap: anywhere; }
            .totals { border-top: 1px solid #222; margin-top: 5px; padding-top: 5px; }
            .total { font-size: 18px; font-weight: 700; }
            .payment { margin-top: 8px; }
            .observations { min-height: 18px; margin-top: 8px; }
            footer { text-align: center; margin: 14px 0 4px; font-size: 10px; }
            .disclaimer { border-top: 1px dashed #555; padding-top: 7px; margin-top: 8px; font-size: 9px; }
            @media screen { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <header>
            <img class="logo" src="${logoUrl}" alt="Servillantas RV">
            <div class="business">SERVILLANTAS RV</div>
            <div>RUC: No configurado</div>
            <div class="muted">Domicilio: No configurado</div>
            <div class="muted">Teléfono: No configurado</div>
          </header>
          <h1 class="center">BOLETA DE VENTA</h1>
          <div class="document center">${this.escape(data.codigo)}</div>
          <div class="customer">
            <strong>${this.escape(data.cliente)}</strong><br>
            ${data.documentoCliente ? `DNI/RUC: ${this.escape(data.documentoCliente)}<br>` : ''}
            ${data.telefono ? `Teléfono: ${this.escape(data.telefono)}` : ''}
          </div>
          <div class="meta">FECHA: ${this.escape(new Date(data.fecha).toLocaleDateString('es-PE'))} &nbsp; HORA: ${this.escape(new Date(data.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }))}</div>
          <table>
            <thead><tr><th>Cant. U.M.</th><th>Código / Descripción</th><th class="numeric">Precio</th><th class="numeric">Total</th></tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <div class="totals">
            <div class="numeric">TOTAL GRAVADO (S/) &nbsp; ${this.money(subtotal)}</div>
            <div class="numeric">I.G.V. referencial (S/) &nbsp; ${this.money(igv)}</div>
            <div class="numeric total">TOTAL (S/) &nbsp; ${this.money(data.total)}</div>
          </div>
          <div><strong>SON:</strong> ${this.escape(amountWords)} ${data.total === 1 ? 'SOL' : 'SOLES'}</div>
          <div class="payment"><strong>FORMA DE PAGO:</strong> ${this.escape(data.formaPago)}</div>
          <div><strong>COND. VENTA:</strong> Contado</div>
          <div class="observations"><strong>Observaciones:</strong> ${this.escape(data.observaciones || '—')}</div>
          <footer>
            Representación impresa de comprobante interno.<br>
            <div class="disclaimer">
              Documento referencial de uso interno. No es una boleta electrónica autorizada por SUNAT.
              Configura RUC, domicilio fiscal y autorización tributaria antes de usarlo como comprobante fiscal.
            </div>
          </footer>
          <script>
            window.addEventListener('load', () => setTimeout(() => { window.focus(); window.print(); }, 150));
          </script>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  private money(amount: number): string {
    return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  private escape(value: string | number): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private numeroEnLetras(total: number): string {
    const entero = Math.floor(total);
    const centimos = Math.round((total - entero) * 100);
    const letras = this.numeroBase(entero);
    return `${letras} CON ${String(centimos).padStart(2, '0')}/100`;
  }

  private numeroBase(value: number): string {
    const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
    const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const underThousand = (n: number): string => {
      if (n === 0) return '';
      if (n === 100) return 'cien';
      if (n < 10) return units[n];
      if (n <= 20) return teens[n - 10];
      if (n < 30) return `veinti${units[n - 20]}`;
      if (n < 100) return n % 10 ? `${tens[Math.floor(n / 10)]} y ${units[n % 10]}` : tens[Math.floor(n / 10)];
      const remainder = n % 100;
      return `${hundreds[Math.floor(n / 100)]}${remainder ? ` ${underThousand(remainder)}` : ''}`;
    };
    if (!Number.isFinite(value) || value < 0 || value >= 1_000_000_000) {
      return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(value);
    }
    if (value === 0) return 'cero';
    const millions = Math.floor(value / 1_000_000);
    const thousands = Math.floor((value % 1_000_000) / 1000);
    const remainder = value % 1000;
    const parts: string[] = [];
    if (millions) parts.push(millions === 1 ? 'un millón' : `${underThousand(millions)} millones`);
    if (thousands) parts.push(thousands === 1 ? 'mil' : `${underThousand(thousands)} mil`);
    if (remainder) parts.push(underThousand(remainder));
    return parts.join(' ').replace(/uno$/, 'un').toUpperCase();
  }
}
