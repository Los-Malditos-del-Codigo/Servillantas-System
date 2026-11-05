import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // El backend puede responder con "message" (ApiError) o "detail" (ProblemDetail);
      // el front lee "mensaje". Se normaliza aquí para no repetir el fallback en cada componente.
      if (error?.error && typeof error.error === 'object' && !error.error.mensaje) {
        const origen = error.error.message ?? error.error.detail;
        if (origen) {
          error.error.mensaje = origen;
        }
      }

      return throwError(() => error);
    })
  );
};
