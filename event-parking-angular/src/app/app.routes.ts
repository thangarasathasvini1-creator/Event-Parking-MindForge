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

  {
    path: 'forgot-password',
    loadComponent: () =>
        import(
        './features/auth/pages/forgot-password/forgot-password'
        ).then((m) => m.ForgotPassword),
    },

    {
    path: 'verify-password-reset-otp',
    loadComponent: () =>
        import(
        './features/auth/pages/verify-password-reset-otp/verify-password-reset-otp'
        ).then((m) => m.VerifyPasswordResetOtp),
    },

        {
    path: 'reset-password',
    loadComponent: () =>
        import(
        './features/auth/pages/reset-password/reset-password'
        ).then((m) => m.ResetPassword),
    },

];