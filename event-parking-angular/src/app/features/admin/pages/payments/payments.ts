import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaymentService, AdminPayment } from '../../../../services/payment';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments implements OnInit {
  private readonly service = inject(PaymentService);

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });

  readonly payments = signal<AdminPayment[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly viewingReceipt = signal<AdminPayment | null>(null);

  // Computed Financial Metrics
  readonly totalRevenue = computed(() =>
    this.payments()
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  );

  readonly totalTransactions = computed(() => this.payments().length);

  readonly completedCount = computed(
    () => this.payments().filter((p) => p.status === 'Completed').length
  );

  readonly failedCount = computed(
    () => this.payments().filter((p) => p.status !== 'Completed').length
  );

  readonly averageTicket = computed(() => {
    const completed = this.completedCount();
    if (completed === 0) return 0;
    return this.totalRevenue() / completed;
  });

  // Filtered payments by current status filter
  readonly filteredPayments = computed(() => {
    const filter = this.status.value;
    const list = this.payments();
    if (!filter) return list;
    return list.filter((p) => p.status.toLowerCase() === filter.toLowerCase());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.getAdminPayments(this.search.value, this.status.value).subscribe({
      next: (rows) => {
        this.payments.set(rows);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'Unable to load payment records from server.');
        this.loading.set(false);
      },
    });
  }

  clearSearch(): void {
    this.search.setValue('');
    this.load();
  }

  setStatusFilter(val: string): void {
    this.status.setValue(val);
    this.load();
  }

  openReceipt(payment: AdminPayment): void {
    this.viewingReceipt.set(payment);
  }

  closeReceipt(): void {
    this.viewingReceipt.set(null);
  }

  printReceipt(): void {
    window.print();
  }

  downloadReceipt(): void {
    const p = this.viewingReceipt();
    if (!p) return;

    const content = `================================================
           EVENTRA OFFICIAL PAYMENT RECEIPT
================================================
Receipt / Payment ID:  #${p.paymentId}
Booking Reference:     ${p.bookingNumber}
Booking ID:            #${p.bookingId}
Customer Name:         ${p.customerName}
Customer ID:           #${p.customerId}
Event Name:            ${p.eventName}
Transaction Ref:       ${p.transactionReference || 'N/A'}
Payment Status:        ${p.status}
Settlement Date:       ${p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}

Total Amount Paid:     LKR ${(p.amount ?? 0).toFixed(2)}
================================================
EVENTRA Ticketing & Parking Reservation System
Official Administrator Copy
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EVENTRA-Receipt-${p.paymentId}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getInitials(name: string): string {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
