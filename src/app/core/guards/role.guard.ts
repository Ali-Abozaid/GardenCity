import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApplicationRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { getHomeRouteForRole } from '../../layout/admin-layout/nav.config';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as ApplicationRole[] | undefined;

  if (!allowedRoles?.length) {
    return true;
  }

  const checkAccess = (role: string | null | undefined) => {
    if (role && allowedRoles.includes(role as ApplicationRole)) {
      return true;
    }

    return router.createUrlTree([getHomeRouteForRole(role)]);
  };

  const cachedUser = auth.currentUser();
  if (cachedUser) {
    return checkAccess(cachedUser.role);
  }

  return auth.loadCurrentUser().pipe(
    map((user) => checkAccess(user.role)),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
