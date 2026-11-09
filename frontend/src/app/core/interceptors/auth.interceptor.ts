import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo aplicar autenticación a endpoints de nuestra propia API
  if (!req.url.includes(environment.apiUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const isLoginReq = req.url.includes('/auth/login');

  const sendWithToken = (token: string | null) => {
    const authReq = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;
    return next(authReq);
  };

  const normalizeError = (error: HttpErrorResponse) => {
    if (error?.error && typeof error.error === 'object' && !error.error.mensaje) {
      const origen = error.error.message ?? error.error.detail;
      if (origen) {
        error.error.mensaje = origen;
      }
    }
    return throwError(() => error);
  };

  if (!isLoginReq && authService.token && !authService.isTokenValid()) {
    return authService.renovarSesionAutomatica().pipe(
      switchMap((sesion) => sendWithToken(sesion.token)),
      catchError((err: HttpErrorResponse) => normalizeError(err))
    );
  }

  return sendWithToken(authService.token).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginReq) {
        return authService.renovarSesionAutomatica().pipe(
          switchMap((sesion) => sendWithToken(sesion.token)),
          catchError((err: HttpErrorResponse) => {
            authService.logout();
            return normalizeError(err);
          })
        );
      }
      return normalizeError(error);
    })
  );
};
