import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as string[];
  const userRole = auth.getRole();
  if (roles && userRole && roles.includes(userRole)) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};