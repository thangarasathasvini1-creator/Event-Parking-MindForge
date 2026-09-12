import { Component, OnInit, inject, signal } from '@angular/core';
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

interface PaymentResponse {
  paymentId?: number;
  bookingId?: number;
  amount?: number;
  status?: string;
  transactionReference?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly booking = signal<Booking | null>(null);
  readonly payment = signal<PaymentResponse | null>(null);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isSuccess = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  bookingId = 0;

  // ============================================================
  // PAYMENT FORM
  // ============================================================

  readonly paymentForm = this.fb.nonNullable.group({
    cardNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{13,19}$/),
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
  // LOAD PAYMENT STATUS
  // ============================================================

  loadPaymentStatus(): void {
    this.bookingService
      .getPaymentStatus(this.bookingId)
      .subscribe({
        next: (payment: PaymentResponse) => {
          this.payment.set(payment);

          const status =
            payment.status?.trim().toLowerCase() ?? '';

          if (
            status === 'success' ||
            status === 'completed' ||
            status === 'paid'
          ) {
            this.isSuccess.set(true);
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

  submitPayment(): void {
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

    this.isSubmitting.set(true);

    this.bookingService
      .makePayment(this.bookingId, {
        paymentMethod: 'Card',
      })
      .subscribe({
        next: (payment: PaymentResponse) => {
          this.payment.set(payment);

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
    this.bookingService
      .getBookingById(this.bookingId)
      .subscribe({
        next: (booking: Booking) => {
          this.booking.set(booking);

          /*
           * Payment is completed.
           * Move customer to booking confirmation page.
           */
          this.router.navigate([
            '/bookings',
            this.bookingId,
            'confirmation',
          ]);
        },

        error: (error: unknown) => {
          console.error(
            'Failed to refresh booking:',
            error
          );

          this.isSubmitting.set(false);

          this.errorMessage.set(
            'Payment was successful, but we could not load the confirmation. Please try again.'
          );
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
          'This booking is no longer available for payment.'
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
  // CARD LUHN VALIDATION
  // ============================================================

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