import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { checkoutGuard } from './core/guards/checkout-guard';

export const routes: Routes = [
  // ==================== PUBLIC / LANDING PAGE ====================
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import(
        './features/customer/pages/landing/landing'
      ).then((m) => m.Landing),
  },

  // ==================== AUTH ====================
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

  // ==================== CUSTOMER (PROTECTED) ====================
  {
    path: 'customer/dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'customer/profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/pages/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'events/:eventId',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/customer/pages/events/event-details/event-details'
      ).then((m) => m.EventDetails),
  },
  {
    path: 'events/:eventId/seats',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/customer/pages/events/seat-selection/seat-selection'
      ).then((m) => m.SeatSelection),
  },
  {
    path: 'events/:eventId/parking-selection',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/customer/pages/events/parking-selection/parking-selection'
      ).then((m) => m.ParkingSelection),
  },
  {
    path: 'events/:eventId/checkout',
    canActivate: [authGuard, checkoutGuard],
    loadComponent: () =>
      import(
        './features/customer/pages/events/checkout/checkout'
      ).then((m) => m.Checkout),
  },

  // ==================== ADMIN (PROTECTED) ====================
  {
    path: 'admin/dashboard',
    redirectTo: 'admin/events',
    pathMatch: 'full',
  },
  {
    path: 'admin/events',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/events/event-list/event-list'
      ).then((m) => m.EventList),
  },
  {
    path: 'admin/events/new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/events/event-form/event-form'
      ).then((m) => m.EventForm),
  },
  {
    path: 'admin/events/:eventId/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/events/event-edit/event-edit'
      ).then((m) => m.EventEdit),
  },
  {
    path: 'admin/venues',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/pages/venues/venue-list/venue-list').then(
        (m) => m.VenueList
      ),
  },
  {
    path: 'admin/venues/new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/pages/venues/venue-form/venue-form').then(
        (m) => m.VenueForm
      ),
  },
  {
    path: 'admin/venues/:venueId/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/pages/venues/venue-edit/venue-edit').then(
        (m) => m.VenueEdit
      ),
  },
  {
    path: 'admin/venues/availability',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/venues/venue-availability/venue-availability'
      ).then((m) => m.VenueAvailability),
  },
  {
    path: 'admin/categories',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-list/category-list'
      ).then((m) => m.CategoryList),
  },
  {
    path: 'admin/categories/new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-form/category-form'
      ).then((m) => m.CategoryForm),
  },
  {
    path: 'admin/categories/:categoryId/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/pages/categories/category-edit/category-edit'
      ).then((m) => m.CategoryEdit),
  },

  // Fallback for unmapped routes
  {
    path: '**',
    redirectTo: '',
  },
];
