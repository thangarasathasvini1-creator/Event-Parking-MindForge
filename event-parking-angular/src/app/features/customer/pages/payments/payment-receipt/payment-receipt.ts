import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Payment } from '../../../../../models/payment.model';
import { PaymentService } from '../../../../../services/payment';

@Component({
  selector: 'app-payment-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-receipt.html',
  styleUrl: './payment-receipt.css'
})
export class PaymentReceipt implements OnInit {

  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  payment: Payment | null = null;

  isLoading = false;
  isDownloading = false;

  errorMessage = '';

  paymentId = 0;

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('paymentId')
    );

    if (!id) {
      this.errorMessage = 'Invalid payment.';
      return;
    }

    this.paymentId = id;
    this.loadPayment();
  }

  // ==================== LOAD PAYMENT ====================

  loadPayment(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.paymentService
      .getPaymentById(this.paymentId)
      .subscribe({
        next: (payment: Payment) => {
          this.payment = payment;
          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load payment:',
            error
          );

          this.isLoading = false;
          this.handleError(error);
        }
      });
  }

  // ==================== DOWNLOAD RECEIPT ====================

  downloadReceipt(): void {
    if (!this.paymentId || this.isDownloading) {
      return;
    }

    this.isDownloading = true;
    this.errorMessage = '';

    this.paymentService
      .getReceipt(this.paymentId)
      .subscribe({
        next: (blob: Blob) => {

          const url =
            window.URL.createObjectURL(blob);

          const link =
            document.createElement('a');

          link.href = url;

          link.download =
            `EVENTRA-Payment-Receipt-${this.paymentId}.pdf`;

          link.click();

          window.URL.revokeObjectURL(url);

          this.isDownloading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Failed to download receipt:',
            error
          );

          this.isDownloading = false;

          this.errorMessage =
            'Unable to download the payment receipt. Please try again.';
        }
      });
  }

  // ==================== PRINT RECEIPT ====================

  printReceipt(): void {
    window.print();
  }

  // ==================== NAVIGATION ====================

  goToPaymentHistory(): void {
    this.router.navigate([
      '/payments'
    ]);
  }

  goToBooking(): void {
    if (!this.payment?.bookingId) {
      return;
    }

    this.router.navigate([
      '/bookings',
      this.payment.bookingId
    ]);
  }

  goToEvents(): void {
    this.router.navigate([
      '/events'
    ]);
  }

  // ==================== HELPERS ====================

  getPaymentStatus(): string {
    return (
      this.payment?.status ??
      'Unknown'
    );
  }

  getPaymentMethod(): string {
    return (
      this.payment?.paymentMethod ??
      'Card'
    );
  }

  getAmount(): number {
    return this.payment?.amount ?? 0;
  }

  getTransactionReference(): string {
    return (
      this.payment?.transactionReference ??
      'N/A'
    );
  }

  getPaidDate(): string | null {
    return (
      this.payment?.paidAt ??
      this.payment?.createdAt ??
      null
    );
  }

  getStatusClass(): string {
    const status =
      this.getPaymentStatus()
        .trim()
        .toLowerCase();

    switch (status) {

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

  // ==================== ERROR HANDLING ====================

  private handleError(
    error: unknown
  ): void {

    const httpError =
      error as {
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
        'You do not have permission to view this receipt.';
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage =
        'Payment receipt was not found.';
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
      'Unable to load the payment receipt. Please try again.';
  }

}