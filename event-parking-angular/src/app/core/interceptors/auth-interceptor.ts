import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStorageService } from '../auth/auth-storage';
import { AuthStateService } from '../auth/auth-state';
import { environment } from '../../../environments/environment';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(AuthStorageService); const state = inject(AuthStateService); const router = inject(Router);
  if (!req.url.startsWith(environment.apiUrl + '/')) return next(req);
  const token = storage.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(catchError(error => {
    if (error.status === 401 && token) { state.clearUser(); void router.navigate(['/login']); }
    if (error.status === 403 && error.error?.code === 'email_unverified') {
      const email = state.getUser()?.email; state.clearUser();
      void router.navigate(['/verify-email'], { queryParams: { email } });
    }
    if (error.status === 403 && /deactivated/i.test(error.error?.message || '')) { state.clearUser(); void router.navigate(['/login']); }
    return throwError(() => error);
  }));
};
