import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Booking } from '../../../../../models/booking.model';
import { BookingService } from '../../../../../services/booking';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.css',
})
export class BookingConfirmation implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly booking = signal<Booking | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  bookingId = 0;

  // ==================== INITIALIZE ====================

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('bookingId'));

    if (!id) {
      this.errorMessage.set('Invalid booking.');
      return;
    }

    this.bookingId = id;
    this.loadBooking();
  }

  // ==================== LOAD BOOKING ====================

  loadBooking(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking: Booking) => {
        this.booking.set(booking);
        this.isLoading.set(false);
      },

      error: (error: unknown) => {
        console.error('Failed to load booking:', error);

        this.errorMessage.set(
          'Unable to load your booking confirmation. Please try again.'
        );

        this.isLoading.set(false);
      },
    });
  }

  // ==================== NAVIGATION ====================

  viewBooking(): void {
    this.router.navigate(['/bookings', this.bookingId]);
  }

  goToBookings(): void {
    this.router.navigate(['/bookings']);
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  // ==================== STATUS ====================

  getStatusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  // ==================== PAYMENT STATUS ====================

  isPaymentSuccessful(): boolean {
    const status = this.booking()?.paymentStatus?.toLowerCase();

    return (
      status === 'paid' || status === 'completed' || status === 'success'
    );
  }
}