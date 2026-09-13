import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CustomerService, CustomerProfile } from '../../../../services/customer.service';
import { BookingService } from '../../../../services/booking';
import { Booking } from '../../../../models/booking.model';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';

export type CustomerFilter = 'customers' | 'active' | 'inactive' | 'verified' | 'admins' | 'all';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private readonly service = inject(CustomerService);
  private readonly bookingsService = inject(BookingService);

  readonly search = new FormControl('', { nonNullable: true });
  readonly statusFilter = signal<CustomerFilter>('customers');

  readonly customers = signal<CustomerProfile[]>([]);
  readonly selected = signal<CustomerProfile | null>(null);
  readonly bookings = signal<Booking[]>([]);
  readonly pending = signal<CustomerProfile | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly detailsLoading = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  // Computed Metrics
  readonly customerCount = computed(() => this.customers().filter((c) => c.role === 'Customer').length);
  readonly adminCount = computed(() => this.customers().filter((c) => c.role === 'Administrator').length);
  readonly activeCustomerCount = computed(
    () => this.customers().filter((c) => c.role === 'Customer' && c.status === 'Active').length
  );
  readonly inactiveCustomerCount = computed(
    () => this.customers().filter((c) => c.role === 'Customer' && c.status !== 'Active').length
  );
  readonly verifiedCustomerCount = computed(
    () => this.customers().filter((c) => c.role === 'Customer' && c.emailVerified).length
  );
  readonly totalCount = computed(() => this.customers().length);

  // Filtered customer list
  readonly filteredCustomers = computed(() => {
    const list = this.customers();
    const filter = this.statusFilter();
    switch (filter) {
      case 'customers':
        return list.filter((c) => c.role === 'Customer');
      case 'active':
        return list.filter((c) => c.role === 'Customer' && c.status === 'Active');
      case 'inactive':
        return list.filter((c) => c.role === 'Customer' && c.status !== 'Active');
      case 'verified':
        return list.filter((c) => c.role === 'Customer' && c.emailVerified);
      case 'admins':
        return list.filter((c) => c.role === 'Administrator');
      case 'all':
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.searchCustomers(this.search.value).subscribe({
      next: (rows) => {
        this.customers.set(rows);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'Unable to load customers from server.');
        this.loading.set(false);
      },
    });
  }

  clearSearch(): void {
    this.search.setValue('');
    this.load();
  }

  setStatusFilter(filter: CustomerFilter): void {
    this.statusFilter.set(filter);
  }

  view(customer: CustomerProfile): void {
    if (customer.role !== 'Customer') return;
    this.selected.set(customer);
    this.bookings.set([]);
    this.detailsLoading.set(true);
    this.error.set('');
    this.bookingsService.getCustomerBookings(customer.customerId).subscribe({
      next: (rows) => {
        if (this.selected()?.customerId === customer.customerId) {
          this.bookings.set(rows);
        }
        this.detailsLoading.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'Unable to load booking history for this customer.');
        this.detailsLoading.set(false);
      },
    });
  }

  closeSelected(): void {
    this.selected.set(null);
    this.bookings.set([]);
  }

  changeStatus(): void {
    const customer = this.pending();
    if (!customer || this.saving() || customer.role !== 'Customer') return;
    this.saving.set(true);
    this.error.set('');
    const request =
      customer.status === 'Active'
        ? this.service.deactivate(customer.customerId)
        : this.service.reactivate(customer.customerId);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.pending.set(null);
        this.selected.set(null);
        this.message.set(`Account status updated for ${customer.name}.`);
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.pending.set(null);
        this.error.set(e.error?.message || 'Unable to update account status.');
      },
    });
  }

  getInitials(name: string): string {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
