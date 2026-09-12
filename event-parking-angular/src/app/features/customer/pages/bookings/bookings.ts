import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking';
import { AuthStateService } from '../../../../core/auth/auth-state';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
})
export class Bookings implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  // ==================== STATE ====================

  readonly bookings = signal<Booking[]>([]);
  readonly isLoading = signal(false);
  readonly isCancelling = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly cancellingBookingId = signal<number | null>(null);

  // ==================== INITIALIZATION ====================

  ngOnInit(): void {
    this.loadBookings();
  }

  // ==================== LOAD BOOKINGS ====================

  loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const user = this.authState.getUser();

    if (!user?.customerId) {
      this.isLoading.set(false);
      this.errorMessage.set(
        'Unable to identify the logged-in customer. Please log in again.'
      );
      return;
    }

    this.bookingService.getCustomerBookings(user.customerId).subscribe({
      next: (bookings: Booking[]) => {
        this.bookings.set(bookings ?? []);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load bookings:', error);
        this.isLoading.set(false);
        this.handleLoadError(error);
      },
    });
  }

  // ==================== VIEW BOOKING ====================

  viewBooking(bookingId: number): void {
    if (!bookingId) {
      return;
    }

    this.router.navigate(['/bookings', bookingId]);
  }

  // ==================== CANCEL BOOKING ====================

  cancelBooking(bookingId: number): void {
    const booking = this.bookings().find((item) => item.bookingId === bookingId);

    if (!booking) {
      return;
    }

    const status = booking.status?.toLowerCase() ?? '';

    if (
      status === 'cancelled' ||
      status === 'completed' ||
      status === 'confirmed'
    ) {
      this.errorMessage.set('This booking cannot be cancelled.');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to cancel booking ${booking.bookingNumber}?`
    );

    if (!confirmed) {
      return;
    }

    this.isCancelling.set(true);
    this.cancellingBookingId.set(bookingId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.cancellingBookingId.set(null);
        this.successMessage.set('Booking cancelled successfully.');
        this.loadBookings();
      },
      error: (error: unknown) => {
        console.error('Failed to cancel booking:', error);
        this.isCancelling.set(false);
        this.cancellingBookingId.set(null);
        this.handleCancelError(error);
      },
    });
  }

  // ==================== NAVIGATION ====================

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  // ==================== STATUS ====================

  getStatusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getPaymentStatusClass(paymentStatus: string | null): string {
    const status = (paymentStatus ?? 'pending').toLowerCase();
    switch (status) {
      case 'paid':
      case 'completed':
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'failed':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  // ==================== CANCEL BUTTON STATE ====================

  isCancellingBooking(bookingId: number): boolean {
    return (
      this.isCancelling() && this.cancellingBookingId() === bookingId
    );
  }

  // ==================== LOAD ERROR ====================

  private handleLoadError(error: unknown): void {
    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 401) {
      this.errorMessage.set('Your session has expired. Please log in again.');
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage.set(
        'You do not have permission to view these bookings.'
      );
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('No booking information was found.');
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage.set(
        'The server is temporarily unavailable. Please try again later.'
      );
      return;
    }

    this.errorMessage.set(
      httpError.error?.message ??
        'Unable to load your bookings. Please try again.'
    );
  }

  // ==================== CANCEL ERROR ====================

  private handleCancelError(error: unknown): void {
    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 400) {
      this.errorMessage.set(
        httpError.error?.message ?? 'This booking cannot be cancelled.'
      );
      return;
    }

    if (httpError.status === 401) {
      this.errorMessage.set('Your session has expired. Please log in again.');
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage.set(
        'You do not have permission to cancel this booking.'
      );
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('Booking was not found.');
      return;
    }

    if (httpError.status === 409) {
      this.errorMessage.set(
        httpError.error?.message ?? 'This booking can no longer be cancelled.'
      );
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage.set(
        'The server is temporarily unavailable. Please try again later.'
      );
      return;
    }

    this.errorMessage.set(
      httpError.error?.message ??
        'Unable to cancel the booking. Please try again.'
    );
  }
}