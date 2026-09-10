import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../auth/auth-state';

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const user = authState.getUser();

  if (user?.role?.toLowerCase() === 'admin') {
    return true;
  }

  if (user) {
    return router.createUrlTree(['/']);
  }

  return router.createUrlTree(['/login']);
};