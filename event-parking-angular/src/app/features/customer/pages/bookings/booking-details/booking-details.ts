import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Booking } from '../../../../../models/booking.model';
import { BookingService } from '../../../../../services/booking';
import { PaymentService } from '../../../../../services/payment';
import { AuthStateService } from '../../../../../core/auth/auth-state';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadge,
    ConfirmationDialog
  ],
  templateUrl: './booking-details.html',
  styleUrl: './booking-details.css',
})
export class BookingDetails implements OnInit, OnDestroy {
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly booking = signal<Booking | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  // Payment link
  readonly paymentId = signal<number | null>(null);

  // Hold Timer state
  readonly holdRemainingSeconds = signal<number>(0);
  readonly formattedHoldTime = signal<string>('10:00');
  readonly isHoldExpired = signal<boolean>(false);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // Cancellation Modal
  readonly showCancelDialog = signal(false);
  readonly isCancelling = signal(false);

  bookingId = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('bookingId'));

    if (!id) {
      this.errorMessage.set('Invalid booking ID.');
      return;
    }

    this.bookingId = id;
    this.loadBooking();
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
  }

  loadBooking(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking: Booking) => {
        this.booking.set(booking);
        this.isLoading.set(false);

        // Manage hold countdown if Pending
        if (booking.status === 'Pending') {
          this.initHoldTimer(booking.holdExpiresAt);
        } else {
          this.clearHoldTimer();
        }

        // If Confirmed/Paid, attempt to find receipt/payment ID
        if (booking.status === 'Confirmed' || booking.paymentStatus === 'Paid') {
          this.fetchPaymentForBooking(booking.bookingId);
        }
      },

      error: (error: unknown) => {
        console.error('Failed to load booking:', error);
        this.errorMessage.set(
          'Unable to load booking details. Please try again.'
        );
        this.isLoading.set(false);
      },
    });
  }

  private fetchPaymentForBooking(bookingId: number): void {
    const user = this.authState.getUser();
    if (!user?.customerId) {
      return;
    }

    this.paymentService.getCustomerPaymentHistory(user.customerId).subscribe({
      next: (payments) => {
        const match = payments?.find(p => p.bookingId === bookingId);
        if (match) {
          this.paymentId.set(match.paymentId);
        }
      },
      error: () => {
        // Non-fatal, receipt button can still fallback to payment history
      }
    });
  }

  private initHoldTimer(holdExpiresAt?: string | null): void {
    this.clearHoldTimer();

    if (!holdExpiresAt) {
      this.isHoldExpired.set(false);
      return;
    }

    const expiryTime = new Date(holdExpiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diffMs = expiryTime - now;
      const totalSec = Math.max(0, Math.floor(diffMs / 1000));

      this.holdRemainingSeconds.set(totalSec);

      if (totalSec <= 0) {
        this.isHoldExpired.set(true);
        this.formattedHoldTime.set('00:00');
        this.clearHoldTimer();
      } else {
        this.isHoldExpired.set(false);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        this.formattedHoldTime.set(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  private clearHoldTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  goBack(): void {
    this.router.navigate(['/bookings']);
  }

  payNow(): void {
    const current = this.booking();
    if (!current) return;
    this.router.navigate(['/events/payment'], {
      queryParams: { bookingId: current.bookingId }
    });
  }

  viewReceipt(): void {
    const pid = this.paymentId();
    if (pid) {
      this.router.navigate(['/payments/receipt', pid]);
    } else {
      this.router.navigate(['/payments/history']);
    }
  }

  browseEvents(): void {
    this.router.navigate(['/events']);
  }

  // --- Cancellation UX with Modal ---
  openCancelModal(): void {
    this.showCancelDialog.set(true);
  }

  closeCancelModal(): void {
    if (!this.isCancelling()) {
      this.showCancelDialog.set(false);
    }
  }

  cancelBooking(): void {
    const current = this.booking();
    if (!current) {
      return;
    }

    this.isCancelling.set(true);
    this.bookingService.cancelBooking(current.bookingId).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.showCancelDialog.set(false);
        this.loadBooking();
      },

      error: (error: unknown) => {
        console.error('Failed to cancel booking:', error);
        this.isCancelling.set(false);
        this.showCancelDialog.set(false);
        this.errorMessage.set(
          'Unable to cancel the booking. Please try again or contact support.'
        );
      },
    });
  }

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
}