import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Payment } from '../../../../../models/payment.model';
import { PaymentService } from '../../../../../services/payment';
import { AuthStateService } from '../../../../../core/auth/auth-state';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    LoadingSpinner,
    EmptyState,
  ],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.css',
})
export class PaymentHistory implements OnInit {
  // ==================== SERVICES ====================

  private readonly paymentService = inject(PaymentService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  // ==================== STATE ====================

  readonly payments = signal<Payment[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly searchQuery = signal('');

  // ==================== COMPUTED ====================

  readonly filteredPayments = computed(() => {
    const list = this.payments();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;

    return list.filter((p) => {
      const ref = (p.transactionReference ?? '').toLowerCase();
      const id = String(p.paymentId);
      const bId = String(p.bookingId);
      const method = (p.paymentMethod ?? '').toLowerCase();
      return ref.includes(query) || id.includes(query) || bId.includes(query) || method.includes(query);
    });
  });

  readonly totalPaid = computed(() => {
    return this.payments().reduce((total, p) => total + (p.amount ?? 0), 0);
  });

  // ==================== INITIALIZATION ====================

  ngOnInit(): void {
    this.loadPaymentHistory();
  }

  // ==================== LOAD PAYMENT HISTORY ====================

  loadPaymentHistory(): void {
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

    this.paymentService.getCustomerPaymentHistory(user.customerId).subscribe({
      next: (payments: Payment[]) => {
        this.payments.set(payments ?? []);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load payment history:', error);
        this.isLoading.set(false);
        this.handleLoadError(error);
      },
    });
  }

  // ==================== TOTAL PAID ====================

  getTotalPaid(): number {
    return this.totalPaid();
  }

  // ==================== SEARCH ====================

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // ==================== NAVIGATION ====================

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  viewBooking(bookingId: number): void {
    if (!bookingId) {
      return;
    }
    this.router.navigate(['/bookings', bookingId]);
  }

  viewReceipt(paymentId: number): void {
    if (!paymentId) {
      return;
    }
    this.router.navigate(['/payments/receipt', paymentId]);
  }

  // ==================== PAYMENT STATUS ====================

  getStatusClass(status: string | null): string {
    const normalizedStatus = (status ?? 'unknown').trim().toLowerCase();
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

  getPaymentMethod(paymentMethod: string | null): string {
    return paymentMethod || 'Card';
  }

  getPaymentAmount(amount: number | null): number {
    return amount ?? 0;
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
        'You do not have permission to view your payment history.'
      );
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('No payment history was found.');
      return;
    }

    if (httpError.status === 409) {
      this.errorMessage.set(
        httpError.error?.message ??
          'Unable to retrieve payment history right now.'
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
        'Unable to load payment history. Please try again.'
    );
  }
}