import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Payment } from '../../../../../models/payment.model';
import { PaymentService } from '../../../../../services/payment';
import { AuthStateService } from '../../../../../core/auth/auth-state';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.css'
})
export class PaymentHistory implements OnInit {

  // ==================== SERVICES ====================

  private readonly paymentService = inject(PaymentService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);


  // ==================== STATE ====================

  payments: Payment[] = [];

  isLoading = false;

  errorMessage = '';


  // ==================== INITIALIZATION ====================

  ngOnInit(): void {
    this.loadPaymentHistory();
  }


  // ==================== LOAD PAYMENT HISTORY ====================

  loadPaymentHistory(): void {

    this.isLoading = true;
    this.errorMessage = '';

    const user = this.authState.getUser();

    if (!user?.customerId) {

      this.isLoading = false;

      this.errorMessage =
        'Unable to identify the logged-in customer. Please log in again.';

      return;
    }

    this.paymentService
      .getCustomerPaymentHistory(user.customerId)
      .subscribe({

        next: (payments: Payment[]) => {

          this.payments = payments ?? [];

          this.isLoading = false;
        },

        error: (error: unknown) => {

          console.error(
            'Failed to load payment history:',
            error
          );

          this.isLoading = false;

          this.handleLoadError(error);
        }

      });
  }


  // ==================== TOTAL PAID ====================

  getTotalPaid(): number {

    return this.payments.reduce(
      (total, payment) =>
        total + (payment.amount ?? 0),
      0
    );
  }


  // ==================== NAVIGATION ====================

  goToBookings(): void {

    this.router.navigate([
      '/bookings'
    ]);
  }


  goToEvents(): void {

    this.router.navigate([
      '/events'
    ]);
  }


  viewBooking(
    bookingId: number
  ): void {

    if (!bookingId) {
      return;
    }

    this.router.navigate([
      '/bookings',
      bookingId
    ]);
  }


  // ==================== PAYMENT STATUS ====================

  getStatusClass(
    status: string | null
  ): string {

    const normalizedStatus =
      (status ?? 'unknown')
        .trim()
        .toLowerCase();

    switch (normalizedStatus) {

      case 'paid':
      case 'completed':
      case 'success':
      case 'successful':

        return 'bg-emerald-100 text-emerald-700';


      case 'failed':
      case 'failure':

        return 'bg-red-100 text-red-700';


      case 'pending':

        return 'bg-amber-100 text-amber-700';


      case 'refunded':

        return 'bg-blue-100 text-blue-700';


      case 'cancelled':
      case 'canceled':

        return 'bg-slate-100 text-slate-600';


      default:

        return 'bg-slate-100 text-slate-600';
    }
  }


  // ==================== PAYMENT METHOD ====================

  getPaymentMethod(
    paymentMethod: string | null
  ): string {

    return paymentMethod || 'Card';
  }


  // ==================== PAYMENT AMOUNT ====================

  getPaymentAmount(
    amount: number | null
  ): number {

    return amount ?? 0;
  }


  // ==================== ERROR HANDLING ====================

  private handleLoadError(
    error: unknown
  ): void {

    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };


    if (httpError.status === 401) {

      this.errorMessage =
        'Your session has expired. Please log in again.';

      return;
    }


    if (httpError.status === 403) {

      this.errorMessage =
        'You do not have permission to view your payment history.';

      return;
    }


    if (httpError.status === 404) {

      this.errorMessage =
        'No payment history was found.';

      return;
    }


    if (httpError.status === 409) {

      this.errorMessage =
        httpError.error?.message ??
        'Unable to retrieve payment history right now.';

      return;
    }


    if (
      httpError.status !== undefined &&
      httpError.status >= 500
    ) {

      this.errorMessage =
        'The server is temporarily unavailable. Please try again later.';

      return;
    }


    this.errorMessage =
      httpError.error?.message ??
      'Unable to load payment history. Please try again.';
  }

}