import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Booking } from '../../../../models/booking.model';
import { Event } from '../../../../models/event.model';
import { BookingService } from '../../../../services/booking';
import { EventService } from '../../../../services/event';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    LoadingSpinner,
    EmptyState,
  ],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
})
export class Bookings implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly eventService = inject(EventService, { optional: true });

  readonly events = signal<Event[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly eventId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly errorMessage = signal('');

  readonly filteredBookings = computed(() => {
    const list = this.bookings();
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return list;
    }

    return list.filter(
      (booking: Booking) =>
        booking.bookingNumber?.toLowerCase().includes(search) ||
        booking.status?.toLowerCase().includes(search) ||
        (booking.paymentStatus ?? '').toLowerCase().includes(search) ||
        String(booking.bookingId).includes(search) ||
        String(booking.customerId).includes(search)
    );
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  // ==================== LOAD EVENTS ====================

  loadEvents(): void {
    if (!this.eventService) return;
    this.isLoadingEvents.set(true);

    this.eventService.getEvents().subscribe({
      next: (events: Event[]) => {
        this.events.set(events ?? []);
        this.isLoadingEvents.set(false);
      },
      error: () => {
        this.isLoadingEvents.set(false);
      }
    });
  }

  onEventSelect(selectedId: unknown): void {
    const parsed = Number(selectedId);
    if (parsed > 0) {
      this.eventId.set(parsed);
      this.loadBookings();
    } else {
      this.eventId.set(null);
      this.bookings.set([]);
    }
  }

  // ==================== LOAD BOOKINGS ====================

  loadBookings(): void {
    const evId = this.eventId();
    if (!evId) {
      this.bookings.set([]);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.bookingService
      .getBookingsByEvent(evId)
      .subscribe({
        next: (bookings: Booking[]) => {
          this.bookings.set(bookings ?? []);
          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          console.error('Failed to load admin bookings:', error);
          this.isLoading.set(false);
          this.handleError(error);
        }
      });
  }

  // ==================== SEARCH ====================

  onSearchInput(event: EventTarget | null): void {
    const input = event as HTMLInputElement;
    if (input) {
      this.searchTerm.set(input.value);
    }
  }

  // ==================== EVENT ID ====================

  setEventId(value: string | number): void {
    const parsed = Number(value);
    const validId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    this.eventId.set(validId);

    if (validId) {
      this.loadBookings();
    } else {
      this.bookings.set([]);
    }
  }

  // ==================== CLEAR SEARCH ====================

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // ==================== REFRESH ====================

  refresh(): void {
    this.loadBookings();
  }

  // ==================== HELPERS ====================

  getStatusClass(status: string): string {
    switch (status?.trim().toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
      case 'hold':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getPaymentStatusClass(status: string | null): string {
    switch ((status ?? '').trim().toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'success':
      case 'successful':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'failed':
      case 'failure':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getPaymentStatus(status: string | null): string {
    return status || 'Pending';
  }

  getSeatsCount(b: Booking): number {
    return b.seatIds?.length ?? b.seatCount ?? 0;
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
      this.errorMessage.set('You do not have permission to view bookings.');
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage.set('No bookings were found for this event.');
      return;
    }

    if (httpError.status !== undefined && httpError.status >= 500) {
      this.errorMessage.set('The server is temporarily unavailable. Please try again later.');
      return;
    }

    this.errorMessage.set(httpError.error?.message ?? 'Unable to load bookings. Please try again.');
  }
}