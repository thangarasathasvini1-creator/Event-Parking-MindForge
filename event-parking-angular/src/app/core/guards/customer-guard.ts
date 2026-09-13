import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStorageService } from '../auth/auth-storage';
import { AuthStateService } from '../auth/auth-state';

/**
 * Guard that protects customer-only routes.
 * Ensures the user is authenticated AND prevents Administrator accounts
 * from viewing or accessing customer pages.
 */
export const customerGuard: CanActivateFn = () => {
  const authStorage = inject(AuthStorageService);
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authStorage.hasToken()) {
    authState.clearUser();
    return router.createUrlTree(['/login']);
  }

  const user = authState.getUser();
  const role = user?.role?.toLowerCase();

  // If user is Administrator, block customer pages and redirect to Admin Dashboard
  if (role === 'admin' || role === 'administrator') {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};
