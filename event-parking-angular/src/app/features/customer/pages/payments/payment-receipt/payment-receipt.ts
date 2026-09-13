import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Payment } from '../../../../../models/payment.model';
import { PaymentService } from '../../../../../services/payment';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-payment-receipt',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadge
  ],
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
      this.errorMessage = 'Invalid payment ID.';
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
      .getPaymentReceipt(this.paymentId)
      .subscribe({
        next: (payment: Payment) => {
          this.payment = payment;
          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load payment receipt:',
            error
          );

          this.isLoading = false;
          this.handleError(error);
        }
      });
  }

  // ==================== DOWNLOAD RECEIPT ====================

  downloadReceipt(): void {
    if (!this.payment || this.isDownloading) {
      return;
    }

    this.isDownloading = true;

    try {
      const p = this.payment;
      const receiptContent = `================================================
           EVENTRA OFFICIAL PAYMENT RECEIPT
================================================
Payment / Receipt ID:  #${p.paymentId}
Booking Reference ID:  #${p.bookingId}
Transaction Ref:       ${p.transactionReference || 'N/A'}
Payment Method:        ${p.paymentMethod || 'Credit / Debit Card'}
Payment Status:        ${p.status}
Settlement Date:       ${new Date(p.paidAt || p.createdAt).toLocaleString()}

Total Amount Paid:     LKR ${(p.amount ?? 0).toFixed(2)}
================================================
EVENTRA Ticketing & Parking Reservation System
Thank you for your booking!
For questions, visit your dashboard at /bookings
================================================`;

      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EVENTRA-Receipt-${p.paymentId}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate downloadable receipt:', err);
    } finally {
      this.isDownloading = false;
    }
  }

  // ==================== PRINT RECEIPT ====================

  printReceipt(): void {
    window.print();
  }

  // ==================== NAVIGATION ====================

  goToPaymentHistory(): void {
    this.router.navigate(['/payments']);
  }

  goToBooking(): void {
    if (!this.payment?.bookingId) {
      return;
    }

    this.router.navigate(['/bookings', this.payment.bookingId]);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  // ==================== HELPERS ====================

  getPaymentStatus(): string {
    return this.payment?.status ?? 'Unknown';
  }

  getPaymentMethod(): string {
    return this.payment?.paymentMethod ?? 'Card';
  }

  getAmount(): number {
    return this.payment?.amount ?? 0;
  }

  getTransactionReference(): string {
    return this.payment?.transactionReference ?? 'N/A';
  }

  getPaidDate(): string | null {
    return this.payment?.paidAt ?? this.payment?.createdAt ?? null;
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: unknown): void {
    const httpError = error as {
      status?: number;
      error?: {
        message?: string;
      };
    };

    if (httpError.status === 401) {
      this.errorMessage = 'Your session has expired. Please log in again.';
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage = 'You do not have permission to view this receipt.';
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage = 'Payment receipt was not found.';
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage = 'The server is temporarily unavailable. Please try again later.';
      return;
    }

    this.errorMessage = httpError.error?.message ?? 'Unable to load the payment receipt. Please try again.';
  }
}