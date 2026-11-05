import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyPen',
  standalone: true,
})
export class CurrencyPenPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'S/ 0.00';
    }
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) {
      return 'S/ 0.00';
    }
    return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
