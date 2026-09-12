import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
})
export class Bookings implements OnInit {

  private readonly bookingService =
    inject(BookingService);

  bookings: Booking[] = [];

  filteredBookings: Booking[] = [];

  eventId: number | null = null;

  searchTerm = '';

  isLoading = false;

  errorMessage = '';

  ngOnInit(): void {
    this.loadBookings();
  }

  // ==================== LOAD BOOKINGS ====================

  loadBookings(): void {

    if (!this.eventId) {
      this.bookings = [];
      this.filteredBookings = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.bookingService
      .getBookingsByEvent(this.eventId)
      .subscribe({
        next: (bookings: Booking[]) => {

          this.bookings = bookings ?? [];

          this.applyFilter();

          this.isLoading = false;
        },

        error: (error: unknown) => {

          console.error(
            'Failed to load admin bookings:',
            error
          );

          this.isLoading = false;

          this.handleError(error);
        }
      });
  }

  // ==================== SEARCH ====================

  applyFilter(): void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!search) {
      this.filteredBookings = [
        ...this.bookings
      ];
      return;
    }

    this.filteredBookings =
      this.bookings.filter(
        (booking: Booking) =>
          booking.bookingNumber
            ?.toLowerCase()
            .includes(search) ||

          booking.status
            ?.toLowerCase()
            .includes(search) ||

          String(booking.bookingId)
            .includes(search)
      );
  }

  // ==================== EVENT ID ====================

  setEventId(value: string): void {

    const parsed =
      Number(value);

    this.eventId =
      Number.isInteger(parsed) &&
      parsed > 0
        ? parsed
        : null;

    if (this.eventId) {
      this.loadBookings();
    } else {
      this.bookings = [];
      this.filteredBookings = [];
    }
  }

  // ==================== CLEAR SEARCH ====================

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ==================== REFRESH ====================

  refresh(): void {
    this.loadBookings();
  }

  // ==================== HELPERS ====================

  getStatusClass(
    status: string
  ): string {

    switch (
      status
        ?.trim()
        .toLowerCase()
    ) {

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

  getPaymentStatusClass(
    status: string | null
  ): string {

    switch (
      (status ?? '')
        .trim()
        .toLowerCase()
    ) {

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

  getPaymentStatus(
    status: string | null
  ): string {
    return status || 'Not Paid';
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
        'You do not have permission to view bookings.';
      return;
    }

    if (httpError.status === 404) {
      this.errorMessage =
        'No bookings were found for this event.';
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
      'Unable to load bookings. Please try again.';
  }
}