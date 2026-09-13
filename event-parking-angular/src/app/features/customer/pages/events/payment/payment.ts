import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { Booking } from '../../../../../models/booking.model';
import { BookingService } from '../../../../../services/booking';
import { Payment as PaymentModel } from '../../../../../models/payment.model';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadge, ConfirmationDialog],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly showPaymentConfirmation = signal(false);
  private serverOffset = 0;
  private holdSyncTimer: ReturnType<typeof setInterval> | null = null;
  readonly simulateSuccess = this.fb.nonNullable.control(true);
  readonly booking = signal<Booking | null>(null);
  readonly payment = signal<PaymentModel | null>(null);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isSuccess = signal(false);
  readonly isAlreadyPaid = signal(false);

  readonly remainingHoldTime = signal<string>('');
  readonly isHoldExpired = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  bookingId = 0;
  private holdTimerInterval: ReturnType<typeof setInterval> | null = null;

  // ============================================================
  // PAYMENT FORM
  // ============================================================

  readonly paymentForm = this.fb.nonNullable.group({
    cardNumber: [
      '',
      [
        Validators.required,
        this.cardNumberValidator,
        this.cardChecksumValidator,
      ],
    ],

    expiry: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/),
        this.expiryValidator,
      ],
    ],

    cvv: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{3,4}$/),
      ],
    ],
  });

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('bookingId')
    );

    if (!id) {
      this.errorMessage.set('Invalid booking.');
      return;
    }

    this.bookingId = id;
    this.loadBooking();
    this.syncHold();
    this.holdSyncTimer = setInterval(() => this.syncHold(), 15000);
  }

  ngOnDestroy(): void {
    if (this.holdSyncTimer) clearInterval(this.holdSyncTimer);
    if (this.holdTimerInterval) {
      clearInterval(this.holdTimerInterval);
      this.holdTimerInterval = null;
    }
  }

  // ============================================================
  // LOAD BOOKING
  // ============================================================

  loadBooking(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.bookingService
      .getBookingById(this.bookingId)
      .subscribe({
        next: (booking: Booking) => {
          this.booking.set(booking);
          this.isLoading.set(false);

          const status = booking.status?.trim().toLowerCase();
          const pStatus = booking.paymentStatus?.trim().toLowerCase();

          if (
            status === 'confirmed' ||
            status === 'completed' ||
            pStatus === 'completed' ||
            pStatus === 'paid'
          ) {
            this.isAlreadyPaid.set(true);
            this.isSuccess.set(true);
          } else if (status === 'cancelled' || status === 'expired') {
            this.isHoldExpired.set(true);
          } else {
            this.initHoldTimer(booking.holdExpiresAt);
          }

          this.loadPaymentStatus();
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load booking:',
            error
          );

          this.errorMessage.set(
            'Unable to load booking information. Please try again.'
          );

          this.isLoading.set(false);
        },
      });
  }

  // ============================================================
  // HOLD TIMER COUNTDOWN
  // ============================================================

  private parseUtcDate(dateStr: string): number {
    let s = dateStr.trim();
    if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
      s += 'Z';
    }
    return new Date(s).getTime();
  }

  private initHoldTimer(holdExpiresAt: string | null | undefined): void {
    if (this.holdTimerInterval) {
      clearInterval(this.holdTimerInterval);
      this.holdTimerInterval = null;
    }

    if (!holdExpiresAt) {
      this.remainingHoldTime.set('');
      this.isHoldExpired.set(false);
      return;
    }

    const expiryTime = this.parseUtcDate(holdExpiresAt);

    const updateCountdown = () => {
      const diff = expiryTime - (Date.now() + this.serverOffset);
      if (diff <= 0) {
        this.remainingHoldTime.set('00:00');
        this.isHoldExpired.set(true);
        if (this.holdTimerInterval) {
          clearInterval(this.holdTimerInterval);
          this.holdTimerInterval = null;
        }
        // Refresh authoritative booking status from backend
        this.bookingService.getBookingById(this.bookingId).subscribe({
          next: (b) => this.booking.set(b),
          error: () => {}
        });
      } else {
        this.isHoldExpired.set(false);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const pad = (n: number) => n.toString().padStart(2, '0');
        this.remainingHoldTime.set(`${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateCountdown();
    this.holdTimerInterval = setInterval(updateCountdown, 1000);
  }

  // ============================================================
  // LOAD PAYMENT STATUS
  // ============================================================

  loadPaymentStatus(): void {
    this.bookingService
      .getPaymentStatus(this.bookingId)
      .subscribe({
        next: (payment: PaymentModel) => {
          this.payment.set(payment);

          const status =
            payment.status?.trim().toLowerCase() ?? '';

          if (
            status === 'success' ||
            status === 'completed' ||
            status === 'paid'
          ) {
            this.isSuccess.set(true);
            this.isAlreadyPaid.set(true);
          }
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load payment status:',
            error
          );
        },
      });
  }

  // ============================================================
  // SUBMIT PAYMENT
  // ============================================================

  syncHold(): void {
    this.bookingService.getHoldStatus(this.bookingId).subscribe({ next: hold => {
      this.serverOffset = this.parseUtcDate(hold.serverTimeUtc) - Date.now();
      this.isHoldExpired.set(!hold.canPay);
      if (hold.canPay) this.initHoldTimer(hold.holdExpiresAt);
    }, error: () => { /* Payment endpoint still validates expiry atomically. */ } });
  }
  requestPayment(): void {
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    this.showPaymentConfirmation.set(true);
  }
  submitPayment(): void {
    if (this.isSubmitting()) return;
    this.showPaymentConfirmation.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const booking = this.booking();

    if (!booking) {
      this.errorMessage.set(
        'Booking information is not available.'
      );
      return;
    }

    if (
      booking.status.trim().toLowerCase() !== 'pending'
    ) {
      this.errorMessage.set(
        'This booking is no longer available for payment.'
      );
      return;
    }

    if (this.isHoldExpired()) {
      this.errorMessage.set(
        'This booking hold has expired. Seats and parking have been released. Please select seats again.'
      );
      return;
    }

    this.isSubmitting.set(true);

    this.bookingService
      .makePayment(this.bookingId, {
        paymentMethod: 'Card',
        simulateSuccess: this.simulateSuccess.value,
      })
      .subscribe({
        next: (payment: PaymentModel) => {
          this.payment.set(payment);
          if (payment.status !== 'Completed') { this.isSubmitting.set(false); this.errorMessage.set('The simulated payment failed. Your booking remains on hold; retry before it expires.'); return; }
          this.successMessage.set(
            'Payment completed successfully.'
          );

          this.isSuccess.set(true);
          this.isSubmitting.set(false);

          this.paymentForm.reset();

          this.reloadBookingAfterPayment();
        },

        error: (error: unknown) => {
          console.error(
            'Payment failed:',
            error
          );

          this.isSubmitting.set(false);
          this.handlePaymentError(error);
        },
      });
  }

  // ============================================================
  // REFRESH BOOKING AFTER PAYMENT
  // ============================================================

  private reloadBookingAfterPayment(): void {
    this.router.navigate(['/bookings'], {
      queryParams: {
        paymentSuccess: 'true',
        bookingId: this.bookingId,
      },
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goToBookingDetails(): void {
    this.router.navigate([
      '/bookings',
      this.bookingId,
    ]);
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  goToConfirmation(): void {
    this.router.navigate([
      '/bookings',
      this.bookingId,
      'confirmation',
    ]);
  }

  goToEvent(): void {
    const b = this.booking();
    const evId = b?.eventId;

    // If booking was still pending on backend, cancel it to release held seats immediately
    if (this.bookingId && b?.status?.toLowerCase() === 'pending') {
      this.bookingService.cancelBooking(this.bookingId).subscribe({
        next: () => {},
        error: () => {},
      });
    }

    if (evId) {
      this.router.navigate(['/events', evId, 'seats']);
    } else {
      this.router.navigate(['/events']);
    }
  }

  // ============================================================
  // PAYMENT ERROR HANDLING
  // ============================================================

  private handlePaymentError(error: unknown): void {
    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 409) {
      this.errorMessage.set(
        httpError.error?.message ??
          'This booking is no longer available for payment. It may have expired or already been paid.'
      );

      this.loadBooking();
      return;
    }

    if (httpError.status === 400) {
      this.errorMessage.set(
        httpError.error?.message ??
          'The payment request is invalid.'
      );
      return;
    }

    if (httpError.status === 401) {
      this.errorMessage.set(
        'Your session has expired. Please log in again.'
      );
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage.set(
        'You do not have permission to make this payment.'
      );
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set(
        'Booking was not found.'
      );
      return;
    }

    if (
      httpError.status !== undefined &&
      httpError.status >= 500
    ) {
      this.errorMessage.set(
        'The payment service is temporarily unavailable. Please try again later.'
      );
      return;
    }

    this.errorMessage.set(
      httpError.error?.message ??
        'Payment could not be completed. Please try again.'
    );
  }

  // ============================================================
  // FORM CONTROLS
  // ============================================================

  get cardNumberControl(): AbstractControl {
    return this.paymentForm.controls.cardNumber;
  }

  get expiryControl(): AbstractControl {
    return this.paymentForm.controls.expiry;
  }

  get cvvControl(): AbstractControl {
    return this.paymentForm.controls.cvv;
  }

  // ============================================================
  // CARD VALIDATION & CHECKSUM
  // ============================================================

  private cardNumberValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null;
    }
    const digitsOnly = raw.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(digitsOnly)) {
      return { pattern: true };
    }
    return null;
  }

  private cardChecksumValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = String(
      control.value ?? ''
    ).replace(/\s+/g, '');

    if (!value || !/^\d+$/.test(value)) {
      return null;
    }

    let sum = 0;
    let shouldDouble = false;

    for (
      let i = value.length - 1;
      i >= 0;
      i--
    ) {
      let digit = Number(value[i]);

      if (shouldDouble) {
        digit *= 2;

        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0
      ? null
      : { invalidCard: true };
  }

  // ============================================================
  // EXPIRY VALIDATION
  // ============================================================

  private expiryValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = String(
      control.value ?? ''
    ).trim();

    if (
      !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(value)
    ) {
      return null;
    }

    const [monthText, yearText] =
      value.split('/');

    const month = Number(monthText);
    const year = 2000 + Number(yearText);

    const now = new Date();

    const currentMonth =
      now.getMonth() + 1;

    const currentYear =
      now.getFullYear();

    if (
      year < currentYear ||
      (
        year === currentYear &&
        month < currentMonth
      )
    ) {
      return {
        expired: true,
      };
    }

    return null;
  }

  // ============================================================
  // BOOKING STATUS STYLE
  // ============================================================

  getStatusClass(status: string): string {
    const s =
      (status ?? '')
        .trim()
        .toLowerCase();

    switch (s) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'cancelled':
      case 'canceled':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}