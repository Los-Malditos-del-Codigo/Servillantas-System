import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { documentoPeruanoValidator, telefonoPeruanoValidator } from './datos-contacto.validators';

describe('contact data validators', () => {
  it('accepts an empty optional document or a numeric DNI/RUC of valid length', () => {
    const control = new FormControl('', documentoPeruanoValidator());

    expect(control.valid).toBe(true);
    control.setValue('12345678');
    expect(control.valid).toBe(true);
    control.setValue('20123456789');
    expect(control.valid).toBe(true);
    control.setValue('1234567');
    expect(control.valid).toBe(false);
    control.setValue('1234ABCD');
    expect(control.valid).toBe(false);
  });

  it('accepts optional phone values only when they contain 7 to 15 digits', () => {
    const control = new FormControl('', telefonoPeruanoValidator());

    expect(control.valid).toBe(true);
    control.setValue('987654321');
    expect(control.valid).toBe(true);
    control.setValue('123456');
    expect(control.valid).toBe(false);
    control.setValue('9876543210123456');
    expect(control.valid).toBe(false);
  });
});
