import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStorageService } from '../auth/auth-storage';
import { AuthStateService } from '../auth/auth-state';

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!inject(AuthStorageService).hasToken()) { authState.clearUser(); return router.createUrlTree(['/login']); }
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