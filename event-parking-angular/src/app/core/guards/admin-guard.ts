import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../auth/auth-state';

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const user = authState.getUser();

  const role = user?.role?.toLowerCase();
  if (role === 'admin' || role === 'administrator') {
    return true;
  }

  if (user) {
    return router.createUrlTree(['/']);
  }

  return router.createUrlTree(['/login']);
};