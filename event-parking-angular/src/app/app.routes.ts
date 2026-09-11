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

    {
    path: 'login/callback',
    loadComponent: () =>
        import('./features/auth/pages/login-callback/login-callback').then(
        (m) => m.LoginCallback
        ),
    },

    {
    path: 'customer/dashboard',
    loadComponent: () =>
        import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
        ),
    },

    {
    path: 'customer/profile',
    loadComponent: () =>
        import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
        ),
    },
    
    {
    path: 'events',
    loadComponent: () =>
        import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
        ),
    },

    {
  path: 'events/:eventId',
  loadComponent: () =>
    import(
      './features/customer/pages/events/event-details/event-details'
    ).then((m) => m.EventDetails),
},

{
  path: 'admin/venues',
  loadComponent: () =>
    import('./features/admin/pages/venues/venue-list/venue-list')
      .then((m) => m.VenueList),
},
{
  path: 'admin/venues/new',
  loadComponent: () =>
    import('./features/admin/pages/venues/venue-form/venue-form')
      .then((m) => m.VenueForm),
},

{
  path: 'admin/venues/:venueId/edit',
  loadComponent: () =>
    import('./features/admin/pages/venues/venue-edit/venue-edit')
      .then((m) => m.VenueEdit),
},

{
  path: 'admin/venues/availability',
  loadComponent: () =>
    import(
      './features/admin/pages/venues/venue-availability/venue-availability'
    ).then((m) => m.VenueAvailability),
},
  
];