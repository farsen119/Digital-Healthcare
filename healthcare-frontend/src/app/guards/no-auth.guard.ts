import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const NoAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUserSubject.value;

  // If not logged in, allow access
  if (!auth.isLoggedIn()) {
    return true;
  }

  // If admin, allow access to register, but not login
  if (user && user.role === 'admin' && route.routeConfig?.path === 'register') {
    return true;
  }

  // Otherwise, redirect to their dashboard
  if (user && user.role === 'admin') {
    router.navigate(['/admin-dashboard']);
  } else if (user && user.role === 'doctor') {
    router.navigate(['/doctor-dashboard']);
  } else if (user && user.role === 'patient') {
    router.navigate(['/patient-dashboard']);
  } else {
    router.navigate(['/']);
  }
  return false;
};