import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Get tokens from localStorage
  let access: string | null = null;
  let refresh: string | null = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    access = localStorage.getItem('access');
    refresh = localStorage.getItem('refresh');
  }

  // 2. Attach access token to request if present
  if (access) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${access}` }
    });
  }

  // 3. Handle errors (401/403) and try to refresh token if needed
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        (error.status === 401 || error.status === 403) && // Handle both 401 and 403
        !req.url.endsWith('/token/refresh/') &&
        refresh
      ) {
        // 4. Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const newAccess = res.access;
            if (newAccess) {
              localStorage.setItem('access', newAccess);
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccess}` }
              });
              return next(newReq);
            } else {
              // 5. No new access token, force logout
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => error);
            }
          }),
          catchError((refreshError) => {
            // 6. Refresh failed, force logout
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      // 7. For all other errors, just throw the error
      return throwError(() => error);
    })
  );
};