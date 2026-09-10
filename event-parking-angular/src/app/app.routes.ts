import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(
        (m) => m.Login
      ),
  },

   {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register').then(
        (m) => m.Register
      ),
  },

  {
    path: 'verify-email',
    loadComponent: () =>
        import('./features/auth/pages/verify-email/verify-email').then(
        (m) => m.VerifyEmail
        ),
  },

];