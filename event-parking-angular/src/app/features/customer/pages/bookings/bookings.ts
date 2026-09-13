import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking';
import { AuthStateService } from '../../../../core/auth/auth-state';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    ConfirmationDialog,
    LoadingSpinner,
    EmptyState,
  ],
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

  // Search & Filter
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<string>('ALL');

  // Confirmation Modal
  readonly showCancelDialog = signal(false);
  readonly bookingToCancel = signal<Booking | null>(null);

  // ==================== COMPUTED ====================

  readonly filteredBookings = computed(() => {
    const list = this.bookings();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus().toUpperCase();

    return list.filter((b) => {
      // Filter by Status
      if (status !== 'ALL') {
        const bStatus = (b.status ?? '').toUpperCase();
        if (bStatus !== status) {
          return false;
        }
      }

      // Filter by Query (bookingNumber, eventName, bookingId)
      if (query) {
        const num = (b.bookingNumber ?? '').toLowerCase();
        const event = (b.eventName ?? '').toLowerCase();
        const id = String(b.bookingId);
        if (!num.includes(query) && !event.includes(query) && !id.includes(query)) {
          return false;
        }
      }

      return true;
    });
  });

  readonly statusCounts = computed(() => {
    const list = this.bookings();
    return {
      all: list.length,
      confirmed: list.filter((b) => (b.status ?? '').toLowerCase() === 'confirmed').length,
      pending: list.filter((b) => (b.status ?? '').toLowerCase() === 'pending').length,
      cancelled: list.filter((b) => (b.status ?? '').toLowerCase() === 'cancelled').length,
      expired: list.filter((b) => (b.status ?? '').toLowerCase() === 'expired').length,
    };
  });

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

  // ==================== FILTERS ====================

  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // ==================== VIEW BOOKING ====================

  viewBooking(bookingId: number): void {
    if (!bookingId) {
      return;
    }

    this.router.navigate(['/bookings', bookingId]);
  }

  payNow(bookingId: number): void {
    if (!bookingId) return;
    this.router.navigate(['/events/payment'], {
      queryParams: { bookingId }
    });
  }

  // ==================== CANCEL BOOKING WITH DIALOG ====================

  openCancelDialog(booking: Booking): void {
    const status = booking.status?.toLowerCase() ?? '';
    if (
      status === 'cancelled' ||
      status === 'completed' ||
      status === 'confirmed'
    ) {
      this.errorMessage.set('This booking cannot be cancelled.');
      return;
    }

    this.bookingToCancel.set(booking);
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    if (!this.isCancelling()) {
      this.showCancelDialog.set(false);
      this.bookingToCancel.set(null);
    }
  }

  confirmCancel(): void {
    const b = this.bookingToCancel();
    if (!b) return;

    this.isCancelling.set(true);
    this.cancellingBookingId.set(b.bookingId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.bookingService.cancelBooking(b.bookingId).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.cancellingBookingId.set(null);
        this.showCancelDialog.set(false);
        this.bookingToCancel.set(null);
        this.successMessage.set(`Booking #${b.bookingNumber} was cancelled successfully.`);
        this.loadBookings();
      },
      error: (error: unknown) => {
        console.error('Failed to cancel booking:', error);
        this.isCancelling.set(false);
        this.cancellingBookingId.set(null);
        this.showCancelDialog.set(false);
        this.bookingToCancel.set(null);
        this.handleCancelError(error);
      },
    });
  }

  // Backward-compatible method if called directly
  cancelBooking(bookingId: number): void {
    const booking = this.bookings().find((item) => item.bookingId === bookingId);
    if (!booking) return;
    this.openCancelDialog(booking);
  }

  // ==================== NAVIGATION ====================

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  // ==================== STATUS UTILITIES ====================

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

  isCancellingBooking(bookingId: number): boolean {
    return (
      this.isCancelling() && this.cancellingBookingId() === bookingId
    );
  }

  // ==================== ERROR HANDLING ====================

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