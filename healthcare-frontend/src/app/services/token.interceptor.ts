import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Safely check for localStorage
  let access: string | null = null;
  let refresh: string | null = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    access = localStorage.getItem('access');
    refresh = localStorage.getItem('refresh');
  }
  if (access) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${access}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.endsWith('/token/refresh/') &&
        refresh // Only try to refresh if refresh token exists
      ) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap((res) => {
            // Retry the original request with new token
            const newAccess = res.access;
            if (newAccess) {
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccess}` }
              });
              return next(newReq);
            } else {
              // No new access token, force logout
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => error);
            }
          }),
          catchError((refreshError) => {
            // Refresh failed, force logout
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};