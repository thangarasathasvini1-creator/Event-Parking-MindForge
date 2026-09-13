import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Payment } from '../../../../../models/payment.model';
import { PaymentService } from '../../../../../services/payment';
import { Booking } from '../../../../../models/booking.model';
import { BookingService } from '../../../../../services/booking';
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
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly payment = signal<Payment | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly isLoading = signal(false);
  readonly isDownloading = signal(false);
  readonly errorMessage = signal('');
  readonly paymentId = signal<number>(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('paymentId'));
      if (!id) {
        this.errorMessage.set('Invalid payment ID.');
        this.isLoading.set(false);
        return;
      }
      this.paymentId.set(id);
      this.loadPayment();
    });
  }

  // ==================== LOAD PAYMENT ====================

  loadPayment(): void {
    const id = this.paymentId();
    if (!id) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paymentService
      .getPaymentReceipt(id)
      .subscribe({
        next: (payment: Payment) => {
          this.payment.set(payment);
          this.isLoading.set(false);

          if (payment.bookingId) {
            this.bookingService.getBookingById(payment.bookingId).subscribe({
              next: (booking: Booking) => {
                this.booking.set(booking);
              },
              error: (err) => {
                console.warn('Unable to load associated booking details for receipt:', err);
              }
            });
          }
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load payment receipt:',
            error
          );

          this.isLoading.set(false);
          this.handleError(error);
        }
      });
  }

  // ==================== DOWNLOAD RECEIPT ====================

  downloadReceipt(): void {
    const p = this.payment();
    const b = this.booking();
    if (!p || this.isDownloading()) {
      return;
    }

    this.isDownloading.set(true);

    try {
      const seatsStr = b?.seatIds && b.seatIds.length > 0
        ? b.seatIds.map(s => '#' + s).join(', ')
        : (b?.seatCount ? `${b.seatCount} seats` : 'N/A');
      const parkingStr = b?.parkingSlotId ? `Slot #${b.parkingSlotId}` : 'None';

      const receiptContent = `================================================
           EVENTRA OFFICIAL PAYMENT RECEIPT
================================================
Receipt / Payment ID:  #${p.paymentId}
Booking Reference:     ${b?.bookingNumber || ('#' + p.bookingId)}
Booking ID:            #${p.bookingId}
Event Name:            ${b?.eventName || 'Event Reservation'}
Seats Reserved:        ${seatsStr}
Parking Reserved:      ${parkingStr}
Payment Method:        ${p.paymentMethod || 'Credit / Debit Card'}
Transaction Ref:       ${p.transactionReference || 'N/A'}
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
      this.isDownloading.set(false);
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
    const bId = this.payment()?.bookingId;
    if (!bId) {
      return;
    }

    this.router.navigate(['/bookings', bId]);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  // ==================== HELPERS ====================

  getPaymentStatus(): string {
    return this.payment()?.status ?? 'Unknown';
  }

  getPaymentMethod(): string {
    return this.payment()?.paymentMethod ?? 'Card';
  }

  getAmount(): number {
    return this.payment()?.amount ?? 0;
  }

  getTransactionReference(): string {
    return this.payment()?.transactionReference ?? 'N/A';
  }

  getPaidDate(): string | null {
    const p = this.payment();
    return p?.paidAt ?? p?.createdAt ?? null;
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
      this.errorMessage.set('Your session has expired. Please log in again.');
      return;
    }

    if (httpError.status === 403) {
      this.errorMessage.set('You do not have permission to view this receipt.');
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('Payment receipt was not found.');
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage.set('The server is temporarily unavailable. Please try again later.');
      return;
    }

    this.errorMessage.set(httpError.error?.message ?? 'Unable to load the payment receipt. Please try again.');
  }
}