import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();
  const esPeticionApi = req.url.startsWith(environment.apiUrl);
  const esLogin = req.url.includes('/auth/login');

  let peticionClonada = req;

  // Si hay token y la petición va hacia nuestra API (y no es login), adjuntar el encabezado
  if (token && esPeticionApi && !esLogin) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor retorna 401 Unauthorized y no estamos en la pantalla de login, cerrar sesión
      if (error.status === 401 && !esLogin) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
