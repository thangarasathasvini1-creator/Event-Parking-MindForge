import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { checkoutGuard } from './core/guards/checkout-guard';
import { customerGuard } from './core/guards/customer-guard';

export const routes: Routes = [

  // ============================================================
  // PUBLIC / LANDING PAGE
  // ============================================================

  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import(
        './features/customer/pages/landing/landing'
      ).then((m) => m.Landing),
  },


  // ============================================================
  // AUTHENTICATION
  // ============================================================

  {
    path: 'login',
    loadComponent: () =>
      import(
        './features/auth/pages/login/login'
      ).then((m) => m.Login),
  },

  {
    path: 'register',
    loadComponent: () =>
      import(
        './features/auth/pages/register/register'
      ).then((m) => m.Register),
  },

  {
    path: 'verify-email',
    loadComponent: () =>
      import(
        './features/auth/pages/verify-email/verify-email'
      ).then((m) => m.VerifyEmail),
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
      import(
        './features/auth/pages/login-callback/login-callback'
      ).then((m) => m.LoginCallback),
  },


  // ============================================================
  // ============================================================
  // CUSTOMER - PROTECTED (WITH PERSISTENT SIDEBAR & TOPBAR SHELL)
  // ============================================================

  {
    path: '',
    canActivate: [customerGuard],
    loadComponent: () =>
      import(
        './features/customer/layout/customer-layout/customer-layout'
      ).then((m) => m.CustomerLayout),
    children: [
      {
        path: 'customer/dashboard',
        loadComponent: () =>
          import(
            './features/customer/pages/dashboard/dashboard'
          ).then((m) => m.Dashboard),
      },

      {
        path: 'customer/profile',
        loadComponent: () =>
          import(
            './features/customer/pages/profile/profile'
          ).then((m) => m.Profile),
      },

      {
        path: 'customer/parking',
        redirectTo: 'bookings',
      },

      {
        path: 'events',
        loadComponent: () =>
          import(
            './features/customer/pages/events/event-list/event-list'
          ).then((m) => m.EventList),
      },

      {
        path: 'events/:eventId',
        loadComponent: () =>
          import(
            './features/customer/pages/events/event-details/event-details'
          ).then((m) => m.EventDetails),
      },

      {
        path: 'events/:eventId/seats',
        loadComponent: () =>
          import(
            './features/customer/pages/events/seat-selection/seat-selection'
          ).then((m) => m.SeatSelection),
      },

      {
        path: 'events/:eventId/parking-selection',
        loadComponent: () =>
          import(
            './features/customer/pages/events/parking-selection/parking-selection'
          ).then((m) => m.ParkingSelection),
      },

      {
        path: 'events/:eventId/checkout',
        canActivate: [checkoutGuard],
        loadComponent: () =>
          import(
            './features/customer/pages/events/checkout/checkout'
          ).then((m) => m.Checkout),
      },

      {
        path: 'bookings',
        loadComponent: () =>
          import(
            './features/customer/pages/bookings/bookings'
          ).then((m) => m.Bookings),
      },

      {
        path: 'bookings/:bookingId/payment',
        loadComponent: () =>
          import(
            './features/customer/pages/events/payment/payment'
          ).then((m) => m.Payment),
      },

      {
        path: 'bookings/:bookingId/confirmation',
        loadComponent: () =>
          import(
            './features/customer/pages/bookings/booking-confirmation/booking-confirmation'
          ).then((m) => m.BookingConfirmation),
      },

      {
        path: 'bookings/:bookingId',
        loadComponent: () =>
          import(
            './features/customer/pages/bookings/booking-details/booking-details'
          ).then((m) => m.BookingDetails),
      },

      {
        path: 'payments',
        loadComponent: () =>
          import(
            './features/customer/pages/payments/payment-history/payment-history'
          ).then((m) => m.PaymentHistory),
      },

      {
        path: 'payments/:paymentId/receipt',
        loadComponent: () =>
          import(
            './features/customer/pages/payments/payment-receipt/payment-receipt'
          ).then((m) => m.PaymentReceipt),
      },

      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/customer/pages/notifications/notifications'
          ).then((m) => m.Notifications),
      },
    ],
  },

  {
    path: 'customer/events',
    redirectTo: 'events',
  },

  {
    path: 'customer/bookings',
    redirectTo: 'bookings',
  },

  {
    path: 'customer/payments',
    redirectTo: 'payments',
  },

  {
    path: 'customer/notifications',
    redirectTo: 'notifications',
  },

  {
    path: 'payments/receipt/:paymentId',
    redirectTo: 'payments/:paymentId/receipt',
  },

  {
    path: 'payments/history',
    redirectTo: 'payments',
  },

  {
    path: 'events/payment',
    redirectTo: 'bookings',
  },


  // ============================================================
  // ADMIN - PROTECTED (WITH PERSISTENT SIDEBAR & TOPBAR SHELL)
  // ============================================================

  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import(
        './features/admin/layout/admin-layout/admin-layout'
      ).then((m) => m.AdminLayout),
    children: [
      { path: 'customers', loadComponent: () => import('./features/admin/pages/customers/customers').then(m => m.Customers) },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/admin/pages/dashboard/dashboard'
          ).then((m) => m.Dashboard),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import(
            './features/admin/pages/bookings/bookings'
          ).then((m) => m.Bookings),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import(
            './features/admin/pages/payments/payments'
          ).then((m) => m.Payments),
      },
      {
        path: 'events',
        loadComponent: () =>
          import(
            './features/admin/pages/events/event-list/event-list'
          ).then((m) => m.EventList),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import(
            './features/admin/pages/events/event-form/event-form'
          ).then((m) => m.EventForm),
      },
      {
        path: 'events/:eventId/edit',
        loadComponent: () =>
          import(
            './features/admin/pages/events/event-edit/event-edit'
          ).then((m) => m.EventEdit),
      },
      {
        path: 'venues',
        loadComponent: () =>
          import(
            './features/admin/pages/venues/venue-list/venue-list'
          ).then((m) => m.VenueList),
      },
      {
        path: 'venues/new',
        loadComponent: () =>
          import(
            './features/admin/pages/venues/venue-form/venue-form'
          ).then((m) => m.VenueForm),
      },
      {
        path: 'venues/:venueId/edit',
        loadComponent: () =>
          import(
            './features/admin/pages/venues/venue-edit/venue-edit'
          ).then((m) => m.VenueEdit),
      },
      {
        path: 'venues/availability',
        loadComponent: () =>
          import(
            './features/admin/pages/venues/venue-availability/venue-availability'
          ).then((m) => m.VenueAvailability),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import(
            './features/admin/pages/categories/category-list/category-list'
          ).then((m) => m.CategoryList),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import(
            './features/admin/pages/categories/category-form/category-form'
          ).then((m) => m.CategoryForm),
      },
      {
        path: 'categories/:categoryId/edit',
        loadComponent: () =>
          import(
            './features/admin/pages/categories/category-edit/category-edit'
          ).then((m) => m.CategoryEdit),
      },
      {
        path: 'seats',
        loadComponent: () =>
          import(
            './features/admin/pages/seats/seats'
          ).then((m) => m.Seats),
      },
      {
        path: 'parking',
        loadComponent: () =>
          import(
            './features/admin/pages/parking/parking'
          ).then((m) => m.Parking),
      },
    ],
  },


  // ============================================================
  // FALLBACK
  // ============================================================

  {
    path: '**',
    redirectTo: '',
  },


];