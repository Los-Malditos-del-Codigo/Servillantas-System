import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function documentoPeruanoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    return !value || /^(?:\d{8}|\d{11})$/.test(value) ? null : { documentoPeruano: true };
  };
}

export function telefonoPeruanoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    return !value || /^\d{7,15}$/.test(value) ? null : { telefonoPeruano: true };
  };
}

export function soloDigitos(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}
